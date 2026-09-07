/* PROJECT 07 — PIZZA SLICE ORBIT / HERO SELECTOR · end-to-end contract.

   The gates that decide this project:
     · eight INDEPENDENT slices, never the assembled pizza;
     · the station is fixed — it cannot move, rotate or scale, ever;
     · every slice lands in that same station, proven on PIXELS and not on the
       geometry agreeing with itself;
     · one progress scalar; the label can never disagree with what is on screen;
     · the drag holds the orbit mid-travel, and the spin really travels.

   Usage: node tests/class11-pizza-slice-orbit-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'tests','screenshots');
fs.mkdirSync(SHOTS,{recursive:true});

const MANIFEST=JSON.parse(fs.readFileSync(path.join(ROOT,'assets','pizza-motion','slices-manifest.json'),'utf8'));
const SRC_DIR=path.join(ROOT,'assets','pizza-motion','source','slices');

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();

const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function selectPreset(page,value,readyFlag){
  await page.waitForFunction(v=>!!document.querySelector(`#motion-orbital-style option[value="${v}"]`),value,{timeout:30000});
  await page.evaluate(v=>{
    const s=document.getElementById('motion-orbital-style');
    s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  },value);
  if(readyFlag)await page.waitForFunction(f=>document.documentElement.dataset[f]==='ready',readyFlag,{timeout:20000});
}
const api=(page,fn,...a)=>page.evaluate(fn,...a);
const stateOf=page=>page.evaluate(()=>window.RestaurantPizzaSliceOrbit.state());
const frameOf=page=>page.evaluate(()=>window.RestaurantPizzaSliceOrbit.frame());
const setP=(page,v)=>page.evaluate(v=>window.RestaurantPizzaSliceOrbit.setProgress(v),v);
/* Waiting on "progress is a whole number" alone is a trap: it is already true the
   instant before a step's tween starts, so the wait returns immediately and the test
   reads the value it began with. The engine reports whether it is animating. */
const settled=async page=>{
  await page.waitForFunction(()=>{
    const s=window.RestaurantPizzaSliceOrbit.state();
    return s.animating||s.spinning||s.dragging;
  },null,{timeout:2000}).catch(()=>{});
  await page.waitForFunction(()=>{
    const s=window.RestaurantPizzaSliceOrbit.state();
    return !s.animating&&!s.spinning&&!s.dragging
      &&Math.abs(s.progress-Math.round(s.progress))<1e-3;
  },null,{timeout:20000});
};

/* The station's box on screen, and the ink inside it. Comparing the ink across slices
   is the only honest proof that they share one frame. */
async function stationInk(page){
  const box=await page.evaluate(()=>{
    const r=document.querySelector('.ps-station').getBoundingClientRect();
    return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};
  });
  const clip={x:Math.max(0,box.x-14),y:Math.max(0,box.y-14),width:box.width+28,height:box.height+28};
  const buf=await page.screenshot({clip});
  const png=`data:image/png;base64,${buf.toString('base64')}`;
  return page.evaluate(async([src,clip])=>{
    const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src});
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data;
    /* the stage is near-black; pizza is not. A luma cut isolates the product. */
    let x0=c.width,x1=-1,y0=c.height,y1=-1,n=0;
    for(let py=0;py<c.height;py++)for(let px=0;px<c.width;px++){
      const i=(py*c.width+px)*4;
      const l=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;
      if(l>62){if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;n++}
    }
    return n?{x0,x1,y0,y1,w:x1-x0+1,h:y1-y0+1,pixels:n,cw:c.width,ch:c.height}:null;
  },[png,clip]);
}

async function run(label,viewport,isMobile){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile});
  const page=await context.newPage();
  const errors=[],bad=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url().split('/').pop()}`)});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});

  /* ---- 0. Studio, additively ---- */
  await page.waitForFunction(()=>{
    const s=document.getElementById('motion-orbital-style');
    if(!s)return false;
    const v=[...s.options].map(o=>o.value);
    return ['elegant','urban','editorial-flow','depth-carousel','anchor-scenes','orbital-food','pizza-slice-orbit']
      .every(x=>v.includes(x));
  },null,{timeout:30000});
  const options=await page.evaluate(()=>[...document.getElementById('motion-orbital-style').options].map(o=>o.value));
  check(`${label} · Studio exposes Pizza Slice Orbit beside all six approved presets`,
    options.includes('pizza-slice-orbit')&&options.length>=7,options.join(','));

  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  /* ---- 1. ASSETS ---- */
  const assets=await page.evaluate(()=>{
    const imgs=[...document.querySelectorAll('.ps-slice .ps-slice-img')];
    return {slices:document.querySelectorAll('.ps-slice').length,
      srcs:imgs.map(i=>i.getAttribute('src')),
      loaded:imgs.filter(i=>i.complete&&i.naturalWidth>0).length,
      ids:[...document.querySelectorAll('.ps-slice')].map(e=>e.dataset.id)};
  });
  check(`${label} · exactly eight independent slice products`,
    assets.slices===8&&new Set(assets.ids).size===8,`${assets.slices} slices, ${new Set(assets.ids).size} distinct ids`);
  check(`${label} · every slice image comes from the runtime folder`,
    assets.srcs.length===8&&assets.srcs.every(s=>/^assets\/pizza-motion\/runtime\/slices\/[a-z0-9-]+\.webp$/.test(s)),
    assets.srcs.slice(0,2).join(' · '));
  check(`${label} · no failed requests`,bad.length===0,bad.slice(0,3).join(' | '));

  /* the assembled pizza belongs to Project 06 and must not be the moving product */
  const fullPizza=await page.evaluate(()=>{
    const hay=[...document.querySelectorAll('.ps-stage *')].map(el=>
      (el.getAttribute?.('src')||'')+' '+(el.style?.backgroundImage||'')).join(' ');
    return /full-pizza|PIZZA%20COMPLETA|PIZZA COMPLETA/i.test(hay);
  });
  check(`${label} · the complete pizza is not used as the moving product`,!fullPizza);

  check(`${label} · registration data exists for all eight`,
    MANIFEST.slices.length===8&&MANIFEST.slices.every(s=>s.registration
      &&Number.isFinite(s.registration.scale)&&Number.isFinite(s.registration.rotationBias)),
    `canonical length ${MANIFEST.canonical.length}px · station ${MANIFEST.canonical.halfAngleDeg}°`);

  /* ---- 2. ONE canonical state ---- */
  const st=await stateOf(page);
  check(`${label} · one progress scalar and one derived active index`,
    st.count===8&&st.activeIndex===((Math.round(st.progress)%8)+8)%8,
    JSON.stringify({progress:st.progress,activeIndex:st.activeIndex}));

  const derived=await page.evaluate(()=>{
    const A=window.RestaurantPizzaSliceOrbit;
    const out=[];
    for(const p of [0,1.4,3.5,6.7,-2.3,11.9]){
      A.setProgress(p);
      const s=A.state();
      const hero=document.querySelector('.ps-slice[data-hero="1"]');
      out.push({p,active:s.activeIndex,heroIndex:hero?+hero.dataset.index:-1,
        name:s.activeName,label:document.querySelector('.ps-name').textContent.trim()});
    }
    A.setProgress(0);
    return out;
  });
  check(`${label} · the hero on stage is always the derived active index`,
    derived.every(d=>d.active===d.heroIndex),derived.map(d=>`${d.p}:${d.active}/${d.heroIndex}`).join(' '));
  check(`${label} · the label can never disagree with the active slice`,
    derived.every(d=>d.name===d.label),derived.map(d=>d.label).join(' · '));

  await settled(page);
  await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-${label}-01-idle.png`)});

  /* ---- 3. GEOMETRY: hero dominance, depth, z-order ---- */
  const f0=await frameOf(page);
  const hero=f0.find(s=>s.hero);
  const byFront=[...f0].sort((a,b)=>b.front-a.front);
  const scaleOf=page=>page.evaluate(()=>[...document.querySelectorAll('.ps-slice')].map(el=>
    +getComputedStyle(el).getPropertyValue('--ps-scale')));
  const scales=await scaleOf(page);
  check(`${label} · the hero is measurably larger than its neighbours`,
    scales[hero.index]/scales[byFront[1].index]>=1.3,
    `hero ${scales[hero.index].toFixed(3)} vs neighbour ${scales[byFront[1].index].toFixed(3)} `
    +`= ${(scales[hero.index]/scales[byFront[1].index]).toFixed(2)}x`);
  check(`${label} · the hero is the brightest and frontmost`,
    hero.opacity>=Math.max(...f0.map(s=>s.opacity))-1e-6&&hero.z>=Math.max(...f0.map(s=>s.z)),
    `opacity ${hero.opacity} z ${hero.z}`);
  const levels=[...new Set(scales.map(v=>Math.round(v*12)))];
  check(`${label} · at least three perceptible depth levels`,levels.length>=3,
    scales.map(v=>v.toFixed(2)).join(' / '));

  /* ---- 4. THE FIXED STATION ----
     Sampled while the orbit is mid-travel: if the frame belonged to the products in
     any way, this is where it would move. */
  const stationSamples=[];
  for(const p of [0,.37,1,2.6,5.2,7.8]){
    await setP(page,p);await page.waitForTimeout(140);
    stationSamples.push(await page.evaluate(()=>{
      const el=document.querySelector('.ps-station');
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),
        transform:cs.transform,rotate:cs.rotate||'none'};
    }));
  }
  const s0=stationSamples[0];
  const stationFixed=stationSamples.every(s=>
    Math.abs(s.x-s0.x)<.6&&Math.abs(s.y-s0.y)<.6&&Math.abs(s.w-s0.w)<.6&&Math.abs(s.h-s0.h)<.6);
  const stationUnrotated=stationSamples.every(s=>s.transform==='none'||/matrix\(1,\s*0,\s*0,\s*1/.test(s.transform));
  check(`${label} · the station never moves while the orbit turns`,stationFixed,
    stationSamples.map(s=>`${s.x},${s.y}`).join(' | '));
  check(`${label} · the station is never rotated or scaled`,stationUnrotated,
    stationSamples[0].transform);

  /* ---- 5. HERO FIT, ON PIXELS ----
     Bring each slice to the station and measure the ink inside the station box. Eight
     differently cut wedges cannot be pixel-identical, but they must occupy the same
     box within tolerance — that is what "every product fits the same frame" means. */
  const inks=[];
  for(let i=0;i<8;i++){
    await setP(page,i);await page.waitForTimeout(240);
    const ink=await stationInk(page);
    if(ink)inks.push({i,id:MANIFEST.slices[i].id,...ink});
  }
  const dim=k=>inks.map(v=>v[k]);
  const spread=k=>Math.max(...dim(k))-Math.min(...dim(k));
  const meanW=dim('w').reduce((a,b)=>a+b,0)/inks.length;
  const meanH=dim('h').reduce((a,b)=>a+b,0)/inks.length;
  const wPct=spread('w')/meanW, hPct=spread('h')/meanH;
  check(`${label} · all eight slices measure the same in the station (pixels)`,
    inks.length===8&&wPct<=.10&&hPct<=.10,
    `width spread ${(wPct*100).toFixed(1)}% · height spread ${(hPct*100).toFixed(1)}% of ${Math.round(meanW)}x${Math.round(meanH)}`);
  /* and they must sit in the same place, not merely be the same size */
  const cxs=inks.map(v=>v.x0+v.w/2), cys=inks.map(v=>v.y0+v.h/2);
  const cxSpread=(Math.max(...cxs)-Math.min(...cxs))/meanW;
  const cySpread=(Math.max(...cys)-Math.min(...cys))/meanH;
  check(`${label} · all eight sit at the same place in the station (pixels)`,
    cxSpread<=.06&&cySpread<=.08,
    `centre spread x ${(cxSpread*100).toFixed(1)}% · y ${(cySpread*100).toFixed(1)}%`);

  await setP(page,0);await settled(page);

  /* ---- 6. STEP ---- */
  const stepNext=await (async()=>{
    const before=(await stateOf(page)).progress;
    await page.click('.ps-next');await settled(page);
    return {before,after:(await stateOf(page)).progress};
  })();
  check(`${label} · next advances exactly one slice`,
    Math.abs(stepNext.after-stepNext.before-1)<1e-6,`${stepNext.before} → ${stepNext.after}`);
  const stepPrev=await (async()=>{
    const before=(await stateOf(page)).progress;
    await page.click('.ps-prev');await settled(page);
    return {before,after:(await stateOf(page)).progress};
  })();
  check(`${label} · prev goes back exactly one slice`,
    Math.abs(stepPrev.before-stepPrev.after-1)<1e-6,`${stepPrev.before} → ${stepPrev.after}`);

  if(!isMobile){
    const kb=await (async()=>{
      const before=(await stateOf(page)).activeIndex;
      await page.locator('.ps-slice[data-hero="1"]').focus();
      await page.keyboard.press('ArrowRight');await settled(page);
      const mid=(await stateOf(page)).activeIndex;
      await page.keyboard.press('ArrowLeft');await settled(page);
      return {before,mid,back:(await stateOf(page)).activeIndex};
    })();
    check(`${label} · the keyboard steps both ways`,
      kb.mid!==kb.before&&kb.back===kb.before,`${kb.before} → ${kb.mid} → ${kb.back}`);
  }

  /* wrap in both directions: 8 → 1 and 1 → 8 */
  await setP(page,7);await settled(page);
  await page.click('.ps-next');await settled(page);
  const wrapUp=await stateOf(page);
  check(`${label} · wraps 08 → 01`,wrapUp.activeIndex===0,
    `progress ${wrapUp.progress} · active ${wrapUp.activeIndex+1}/8 · ${wrapUp.activeName}`);
  await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-${label}-07-wrap.png`)});
  await setP(page,0);await settled(page);
  await page.click('.ps-prev');await settled(page);
  const wrapDown=await stateOf(page);
  check(`${label} · wraps 01 → 08`,wrapDown.activeIndex===7,
    `progress ${wrapDown.progress} · active ${wrapDown.activeIndex+1}/8 · ${wrapDown.activeName}`);

  /* ---- 7. DRAG = PROGRESS ---- */
  await setP(page,0);await settled(page);
  const box=await page.locator('.orbit-shell').boundingBox();
  const gx=box.x+box.width*.5;
  const gy=Math.min(Math.max(box.y+box.height*.62,40),viewport.height-40);
  const held=[];
  await page.mouse.move(gx,gy);
  await page.mouse.down();
  for(let i=1;i<=8;i++){
    await page.mouse.move(gx-i*(isMobile?9:13),gy);
    await page.waitForTimeout(26);
    if(i%2===0)held.push(+(await stateOf(page)).progress.toFixed(3));
  }
  const mid=await stateOf(page);
  check(`${label} · the orbit is mid-travel while the pointer is down`,
    mid.dragging&&mid.progress>.05&&mid.progress<.95,
    `progress ${mid.progress.toFixed(3)} · dragging ${mid.dragging}`);
  check(`${label} · progress tracks the pointer continuously`,
    held.length>=4&&held.every((v,i,a)=>i===0||v>a[i-1]),held.join(' → '));
  await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-${label}-${isMobile?'02-half-drag':'03-half-drag'}.png`)});
  await page.mouse.up();await settled(page);
  const afterDrag=await stateOf(page);
  check(`${label} · release snaps to a whole slice`,
    Math.abs(afterDrag.progress-Math.round(afterDrag.progress))<1e-3,`settled at ${afterDrag.progress}`);

  if(!isMobile){
    /* a quarter drag, captured, then cancelled back to where it started */
    await setP(page,0);await settled(page);
    await page.mouse.move(gx,gy);await page.mouse.down();
    for(let i=1;i<=4;i++){await page.mouse.move(gx-i*7,gy);await page.waitForTimeout(26)}
    await page.screenshot({path:path.join(SHOTS,'pizza-slice-orbit-desktop-02-quarter-drag.png')});
    await page.mouse.up();await settled(page);
    const cancelled=await stateOf(page);
    check(`${label} · a short drag returns to the slice it started on`,
      cancelled.activeIndex===0&&Math.abs(cancelled.progress)<1e-3,
      `progress ${cancelled.progress} · active ${cancelled.activeIndex}`);
  }

  /* A long drag must COMPLETE rather than snap back. Measure the travel, not the
     index: a drag that legitimately carries the orbit round to slice 1 would look
     like a failure to an index comparison. */
  await setP(page,0);await settled(page);
  const dragStart=(await stateOf(page)).progress;
  await page.mouse.move(gx,gy);await page.mouse.down();
  for(let i=1;i<=14;i++){await page.mouse.move(gx-i*(isMobile?12:16),gy);await page.waitForTimeout(20)}
  const preRelease=(await stateOf(page)).progress;
  await page.mouse.up();await settled(page);
  const completed=await stateOf(page);
  check(`${label} · a long drag completes instead of snapping back`,
    Math.abs(completed.progress-dragStart)>=1-1e-6&&preRelease>.9,
    `held at ${preRelease.toFixed(3)} · settled at ${completed.progress} `
    +`(from ${dragStart}) · ${completed.activeName}`);
  await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-${label}-${isMobile?'03-settled':'04-next-settled'}.png`)});

  /* ---- 8. SPIN / DISCOVER ---- */
  await setP(page,0);await settled(page);
  const plan=await page.evaluate(()=>{
    window.RestaurantPizzaSliceOrbit.setRng(()=>0);       /* deterministic */
    return window.RestaurantPizzaSliceOrbit.spin({target:5,turns:3});
  });
  check(`${label} · a forced target produces a multi-turn plan`,
    plan&&plan.target===5&&plan.turns===3&&plan.finalProgress===5+3*8,
    JSON.stringify(plan));

  /* sample the travel: it must pass through whole revolutions, not tween the short way */
  const travel=[];
  for(let i=0;i<26;i++){
    const s=await stateOf(page);
    travel.push(+s.progress.toFixed(2));
    if(!s.spinning)break;
    await page.waitForTimeout(120);
    if(i===7)await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-${label}-05-spin-fast.png`)});
  }
  const spanned=Math.max(...travel)-Math.min(...travel);
  check(`${label} · the spin really travels several revolutions`,spanned>=8*2,
    `${spanned.toFixed(1)} progress units = ${(spanned/8).toFixed(2)} revolutions`);
  /* a second trigger during a spin must be refused, not queued */
  /* Only attempt the second spin while the first is genuinely running — calling it
     after the first finished would start a real spin and move the target. */
  const reentry=await page.evaluate(()=>{
    const s=window.RestaurantPizzaSliceOrbit.state();
    return {spinning:s.spinning,
      second:s.spinning?window.RestaurantPizzaSliceOrbit.spin({target:1,turns:1}):'skipped'};
  });
  if(reentry.spinning)check(`${label} · a spin cannot be re-triggered while running`,reentry.second===null,
    JSON.stringify(reentry));

  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:25000});
  await settled(page);
  const spun=await stateOf(page);
  check(`${label} · the spin lands exactly on the requested slice`,
    spun.activeIndex===5&&Math.abs(spun.progress-plan.finalProgress)<1e-3,
    `active ${spun.activeIndex} · ${spun.activeName} · progress ${spun.progress}`);
  const sync=await page.evaluate(()=>({
    label:document.querySelector('.ps-name').textContent.trim(),
    counter:document.querySelector('.ps-counter').textContent.trim(),
    live:document.querySelector('.ps-live').textContent.trim(),
    hero:document.querySelector('.ps-slice[data-hero="1"]')?.dataset.id
  }));
  check(`${label} · the visual result and the announced result are the same slice`,
    sync.label===spun.activeName&&sync.hero===spun.activeId
    &&sync.live===`Selected pizza: ${spun.activeName}`
    &&sync.counter===`0${spun.activeIndex+1} / 08`,JSON.stringify(sync));
  await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-${label}-${isMobile?'04-spin-result':'06-spin-result'}.png`)});

  /* every one of the eight must be reachable by a forced spin */
  const forced=[];
  for(const t of [0,3,7]){
    await page.evaluate(v=>window.RestaurantPizzaSliceOrbit.spin({target:v,turns:1}),t);
    await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:25000});
    await settled(page);
    const s=await stateOf(page);
    forced.push({want:t,got:s.activeIndex,name:s.activeName});
  }
  check(`${label} · a deterministic target is honoured every time`,
    forced.every(f=>f.want===f.got),forced.map(f=>`${f.want}→${f.got}`).join(' '));

  /* ---- 9. no teleport across a whole revolution ---- */
  const path0=[];
  for(let k=0;k<=16;k++){
    await setP(page,k/2);await page.waitForTimeout(60);
    path0.push(await page.evaluate(()=>[...document.querySelectorAll('.ps-slice')].map(el=>{
      const r=el.getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)];
    })));
  }
  let worst=0;
  for(let i=0;i<8;i++)for(let k=1;k<path0.length;k++){
    const a=path0[k-1][i],b=path0[k][i];
    worst=Math.max(worst,Math.hypot(b[0]-a[0],b[1]-a[1]));
  }
  check(`${label} · no slice teleports across a full revolution`,worst<box.width*.26,
    `largest step ${Math.round(worst)}px over ${path0.length} samples`);

  const zTrack=[];
  for(const p of [0,.25,.5,.75,1]){
    await setP(page,p);await page.waitForTimeout(80);
    zTrack.push((await frameOf(page))[1].z);
  }
  check(`${label} · z-order changes during the motion, not only at the end`,
    new Set(zTrack).size>=4&&zTrack[zTrack.length-1]>zTrack[0],zTrack.join(' → '));

  /* ---- 10. layout ---- */
  await setP(page,0);await settled(page);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(`${label} · no horizontal overflow`,overflow<=2,`${overflow}px`);
  const inFrame=await page.evaluate(()=>{
    const sec=document.querySelector('.orbital-section').getBoundingClientRect();
    const hero=document.querySelector('.ps-slice[data-hero="1"]').getBoundingClientRect();
    return {heroInside:hero.left>=sec.left-2&&hero.right<=sec.right+2
      &&hero.top>=sec.top-2&&hero.bottom<=sec.bottom+2,
      controls:!!document.querySelector('.ps-spin'),
      name:document.querySelector('.ps-name').textContent.trim().length>2};
  });
  check(`${label} · the hero slice is never clipped by the section`,inFrame.heroInside);
  check(`${label} · name, counter and discover stay available`,inFrame.controls&&inFrame.name);

  /* ---- 11. cleanup on leaving ---- */
  await selectPreset(page,'orbital-food','orbitalFood');
  await page.waitForTimeout(1400);
  const left=await page.evaluate(()=>({
    stageHidden:document.querySelector('.ps-stage')?.hidden===true,
    datasets:['pizzaSliceOrbit','pizzaProgress','pizzaDrag','pizzaSpin']
      .filter(k=>k in document.documentElement.dataset),
    accentVar:document.documentElement.style.getPropertyValue('--ps-accent'),
    p03:{ready:document.documentElement.dataset.orbitalFood==='ready',
      renderer:window.RestaurantOrbit.hasDishRenderer(),
      dishes:document.querySelectorAll('#orbit-stage .orbit-dish').length}
  }));
  check(`${label} · leaving the preset removes its stage, datasets and vars`,
    left.stageHidden&&left.datasets.length===0&&!left.accentVar,JSON.stringify(left));
  check(`${label} · Project 03 still works after Pizza Slice Orbit`,
    left.p03.ready&&left.p03.renderer&&left.p03.dishes>=6,JSON.stringify(left.p03));
  await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-regression-orbital-food.png`)});

  /* a spin must not survive the preset change */
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  await page.waitForTimeout(800);
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:2,turns:4}));
  await page.waitForTimeout(220);
  await selectPreset(page,'depth-carousel','depthCarousel');
  await page.waitForTimeout(1500);
  const afterKill=await page.evaluate(()=>({
    spinning:window.RestaurantPizzaSliceOrbit.state().spinning,
    spinFlag:'pizzaSpin' in document.documentElement.dataset,
    p01:[...document.querySelectorAll('.dc-plate')].filter(e=>+getComputedStyle(e.firstElementChild).opacity>=.3).length
  }));
  check(`${label} · a spin in flight is cancelled by leaving the preset`,
    !afterKill.spinning&&!afterKill.spinFlag,JSON.stringify(afterKill));
  check(`${label} · Project 01 still works after Pizza Slice Orbit`,
    afterKill.p01>=(isMobile?4:5),`${afterKill.p01} plates`);
  await page.screenshot({path:path.join(SHOTS,`pizza-slice-orbit-regression-depth-carousel.png`)});

  await selectPreset(page,'anchor-scenes','anchorScenes');
  await page.waitForTimeout(1400);
  check(`${label} · Project 02 still works after Pizza Slice Orbit`,
    await page.evaluate(()=>document.querySelectorAll('.sc-scene[data-kind="scene"]').length===2
      &&document.querySelector('.ps-stage')?.hidden===true));

  await selectPreset(page,'elegant');
  await page.waitForTimeout(1300);
  check(`${label} · Elegant Orbit is restored intact`,
    await page.evaluate(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=6
      &&getComputedStyle(document.getElementById('orbit-stage')).visibility!=='hidden'
      &&document.querySelector('.ps-stage')?.hidden===true));

  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  await page.waitForTimeout(900);
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(700);
  check(`${label} · Restaurant Studio still opens`,
    await page.evaluate(()=>document.getElementById('studio').getAttribute('aria-hidden')==='false'));
  await page.evaluate(()=>document.querySelector('#studio-close').click());
  await page.waitForTimeout(400);

  const fatal=errors.filter(e=>!/favicon|net::ERR/i.test(e));
  check(`${label} · no JS errors`,fatal.length===0,fatal.slice(0,3).join(' | '));
  await context.close();
}

/* ---- the immutable masters ---- */
{
  const onDisk=fs.readdirSync(SRC_DIR).filter(f=>/\.png$/i.test(f)).sort();
  const sizesMatch=MANIFEST.slices.every(s=>{
    const p=path.join(ROOT,s.source);
    return fs.existsSync(p)&&fs.statSync(p).size===s.sourceBytes;
  });
  check('sources · eight master PNGs are present and byte-for-byte untouched',
    onDisk.length===8&&sizesMatch,`${onDisk.length} files, sizes match: ${sizesMatch}`);
  const fp=path.join(ROOT,MANIFEST.fullPizzaReference);
  check('sources · the complete pizza master is present and untouched',
    fs.existsSync(fp)&&fs.statSync(fp).size===MANIFEST.fullPizzaBytes,
    `${Math.round(MANIFEST.fullPizzaBytes/1024)}KB`);
  const runtimeDir=path.join(ROOT,'assets','pizza-motion','runtime','slices');
  const declared=new Set(MANIFEST.slices.map(s=>path.basename(s.runtimeAsset)));
  const stray=fs.readdirSync(runtimeDir).filter(f=>!declared.has(f));
  const totalKb=Math.round(MANIFEST.slices.reduce((a,s)=>a+s.bytes,0)/1024);
  check('runtime · eight declared assets, nothing stray, and far lighter than source',
    stray.length===0&&declared.size===8&&totalKb<3000,
    `${totalKb}KB runtime vs ${Math.round(MANIFEST.slices.reduce((a,s)=>a+s.sourceBytes,0)/1024)}KB source`);
  check('registration · the audit reports the whole set fits one station',
    MANIFEST.verdict.registered&&MANIFEST.verdict.fitsStation,
    `length spread ${(MANIFEST.verdict.lengthSpreadPct*100).toFixed(2)}% · `
    +`axis ${MANIFEST.verdict.axisSpreadDeg}° · tightest margin ${MANIFEST.verdict.tightestMarginDeg}°`);
}

await run('desktop',{width:1440,height:900},false);
await run('mobile',{width:390,height:844},true);

/* ---- reduced motion ---- */
{
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const rm=await stateOf(page);
  check('reduced-motion · the preset reports reduced motion and stays usable',
    rm.reduced&&rm.count===8&&!!rm.activeName,JSON.stringify({count:rm.count,name:rm.activeName}));

  const before=(await stateOf(page)).activeIndex;
  await page.click('.ps-next');await settled(page);
  check('reduced-motion · step still changes the selection',
    (await stateOf(page)).activeIndex!==before);

  const t0=Date.now();
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:6}));
  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:15000});
  await settled(page);
  const ms=Date.now()-t0;
  const rmSpun=await stateOf(page);
  check('reduced-motion · discover still selects, without the long spin',
    rmSpun.activeIndex===6&&ms<2600,`${rmSpun.activeName} in ${ms}ms`);
  check('reduced-motion · the selection is still announced',
    await page.evaluate(()=>/^Selected pizza: /.test(document.querySelector('.ps-live').textContent)),
    await page.evaluate(()=>document.querySelector('.ps-live').textContent));
  await page.screenshot({path:path.join(SHOTS,'pizza-slice-orbit-reduced-motion.png')});
  await context.close();
}

await browser.close();server.close();

const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots → ${SHOTS}`);
if(failed.length){console.error(`PIZZA_SLICE_ORBIT_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('PIZZA_SLICE_ORBIT_PASS');
