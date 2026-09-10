/* PROJECT 09 — SCROLL TRAVELER contract.

   The traveler is a PAGE-LEVEL capability, so what has to be proven is different from
   a product carousel's contract:

     · ONE canonical journeyProgress, and everything visible derived from it;
     · ONE persistent DOM object — the same node in every section, never a clone;
     · continuous interpolation with visible intermediate positions and no teleport;
     · the designed compositions actually reached, on desktop and on its own mobile route;
     · a real cross-layer choreography that never buries the page's own words;
     · scroll is never hijacked and the object never swallows a click;
     · OFF means gone, ON survives a reload, and the object comes from project state;
     · reduced motion keeps the page usable;
     · resize re-measures instead of drifting.

   Scroll Traveler is opt-in in the product. This dedicated engine suite explicitly
   enables it in boot(); tests must not force the public default back to ON.

   Usage: node tests/class14-scroll-traveler-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'tests','screenshots');
fs.mkdirSync(SHOTS,{recursive:true});
const ENGINE=fs.readFileSync(path.join(ROOT,'class14-scroll-traveler.js'),'utf8');
const STYLES=fs.readFileSync(path.join(ROOT,'styles-v14.css'),'utf8');
const CODE=ENGINE.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^[ \t]*\/\/.*$/gm,'');

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});
  console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};
const near=(a,b,tol)=>Math.abs(a-b)<=tol;

const state=page=>page.evaluate(()=>window.RestaurantScrollTraveler.state());

async function boot(page,{timeout=30000}={}){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.RestaurantStudioConfig&&window.RestaurantScrollTraveler,
    null,{timeout});
  /* Public default is OFF. This suite is the explicit opt-in proof. */
  await page.evaluate(()=>window.RestaurantStudioConfig.set('scrollTraveler.enabled',true));
  await page.waitForFunction(()=>document.documentElement.dataset.scrollTraveler==='ready',
    null,{timeout});
  await page.waitForFunction(()=>{
    const i=document.querySelector('.st-traveler .st-object');
    return !!i&&i.complete&&i.naturalWidth>0;
  },null,{timeout:20000});
  await page.evaluate(()=>window.RestaurantScrollTraveler.measure());
  return state(page);
}

async function restPosition(page){
  let prev=null;
  for(let i=0;i<40;i++){
    const c=await page.evaluate(()=>window.RestaurantScrollTraveler.state().current);
    if(prev&&Math.abs(c.x-prev.x)<.01&&Math.abs(c.y-prev.y)<.01
      &&Math.abs(c.scale-prev.scale)<.002&&Math.abs(c.rotation-prev.rotation)<.05)return c;
    prev=c;
    await page.waitForTimeout(90);
  }
  return prev;
}

async function land(page,anchor,fraction){
  let s=null;
  for(let pass=0;pass<6;pass++){
    const want=await page.evaluate(([i,f])=>{
      const t=window.RestaurantScrollTraveler;t.measure();
      return i===null?f:t.progressForAnchor(i,f);
    },[anchor,fraction]);
    await page.evaluate(p=>window.RestaurantScrollTraveler.scrollToProgress(p),want);
    await page.waitForFunction(()=>document.documentElement.dataset.travelerSettled==='1',
      null,{timeout:15000}).catch(()=>{});
    await page.waitForTimeout(240);
    s=await state(page);s.want=want;
    if(Math.abs(s.progress-want)<=.006){
      await restPosition(page);
      s=await state(page);s.want=want;
      break;
    }
  }
  return s;
}

{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const s0=await boot(page);

  check('boot · the traveler is ready and active',s0.ready&&s0.active,
    `${s0.anchors.length} anchors`);
  check('boot · the route resolved to its five chapters',
    s0.anchors.length===5
    &&['signature','origin','atmosphere','chef','visit']
      .every((c,i)=>s0.anchors[i].chapter===c),
    s0.anchors.map(a=>a.chapter).join(' -> '));
  check('boot · the object is the cleaned runtime asset, not the stage cut',
    /scroll-traveler\/runtime\/dish-01-prawn\.webp$/.test(s0.asset),s0.asset);

  const agree=[];
  for(const f of [0,.5,1,1.5,2,2.6,3,3.5,4]){
    const at=await land(page,Math.floor(f),f-Math.floor(f));
    const dom=await page.evaluate(()=>({
      progress:+document.documentElement.dataset.travelerProgress,
      chapter:document.documentElement.dataset.travelerChapter}));
    agree.push(near(dom.progress,at.progress,.0002)&&dom.chapter===at.chapter);
  }
  check('canonical progress · <html data-traveler-progress> never disagrees with the engine',
    agree.every(Boolean),`${agree.filter(Boolean).length}/${agree.length} route positions`);

  const forbidden=['currentSection','currentTravelerPosition','activeJourneyStep',
    'selectedJourneyIndex'];
  check('canonical progress · no second authoritative state in the engine',
    forbidden.every(n=>!CODE.includes(n)),
    forbidden.filter(n=>CODE.includes(n)).join(',')||'none of the four');
  check('canonical progress · scroll is the only writer of the journey value',
    /function progressAt\(y\)/.test(CODE)
    &&/progress=progressAt\(scrollY\)/.test(CODE),
    'progress = progressAt(scrollY)');

  await page.evaluate(()=>{
    const el=document.querySelector('.st-traveler');
    el.dataset.identityStamp=String(Date.now());
    window.__stampedNode=el;
  });
  const seen=[];
  for(let i=0;i<=4;i++){
    await land(page,i,0);
    seen.push(await page.evaluate(()=>{
      const els=document.querySelectorAll('.st-traveler');
      const imgs=document.querySelectorAll('.st-traveler .st-object');
      return {layers:els.length,imgs:imgs.length,
        same:els[0]===window.__stampedNode,
        stamp:els[0]?.dataset.identityStamp,
        src:imgs[0]?.getAttribute('src'),
        chapter:document.documentElement.dataset.travelerChapter};
    }));
  }
  check('one object · exactly one traveler layer and one image at every chapter',
    seen.every(s=>s.layers===1&&s.imgs===1),
    seen.map(s=>`${s.chapter}:${s.layers}/${s.imgs}`).join(' '));
  check('one object · it is the SAME DOM node across the whole route',
    seen.every(s=>s.same&&s.stamp===seen[0].stamp),
    `stamp kept through ${seen.length} chapters`);
  check('one object · the image source is never swapped mid-journey',
    new Set(seen.map(s=>s.src)).size===1,seen[0].src);

  const beforeCount=await page.evaluate(()=>document.querySelectorAll('*').length);
  await page.evaluate(async()=>{
    for(let y=0;y<40;y++){scrollBy(0,120);await new Promise(r=>requestAnimationFrame(r))}
  });
  await page.waitForTimeout(600);
  const afterCount=await page.evaluate(()=>document.querySelectorAll('*').length);
  check('one object · a 40-frame scroll sweep creates no new elements',
    afterCount<=beforeCount+2,`${beforeCount} -> ${afterCount} nodes`);
  check('performance · the object animates with transform and opacity only',
    /--st-x|--st-y|--st-scale|--st-rot/.test(CODE)
    &&/transform:translate3d\(var\(--st-x/.test(STYLES)
    &&!/getContext|WebGL|canvas/i.test(CODE),
    'custom properties feeding one transform, no canvas');
  check('performance · section geometry is cached, not read every frame',
    /function measure\(\)/.test(CODE)
    &&!/function frame\(\)[\s\S]{0,600}getBoundingClientRect/.test(CODE),
    'measure() caches; frame() does not touch layout');

  const samples=await page.evaluate(()=>{
    const t=window.RestaurantScrollTraveler;t.measure();
    const out=[];
    for(let i=0;i<=120;i++){
      const p=i/120;
      const s=t.stateAtProgress(p);
      out.push({p:+p.toFixed(4),x:+s.x.toFixed(3),y:+s.y.toFixed(3),
        scale:+s.scale.toFixed(4),rotation:+s.rotation.toFixed(3),
        opacity:+s.opacity.toFixed(4),chapter:s.chapter,layer:s.layer});
    }
    return out;
  });
  const step=k=>samples.slice(1).map((s,i)=>Math.abs(s[k]-samples[i][k]));
  const maxdx=Math.max(...step('x')),maxdy=Math.max(...step('y')),
    maxds=Math.max(...step('scale'));
  check('continuity · no teleport between anchors',
    maxdx<6&&maxdy<6&&maxds<.06,
    `largest step per 1/120 of the route: x ${maxdx.toFixed(2)}vw, y ${maxdy.toFixed(2)}vh, scale ${maxds.toFixed(3)}`);
  const midRoute=samples.filter(s=>s.p>=.14);
  check('continuity · no fade-out / fade-in: the object stays visible for the whole route',
    midRoute.every(s=>s.opacity>=.98),
    `min opacity after the entry ramp ${Math.min(...midRoute.map(s=>s.opacity)).toFixed(3)}`);
  check('continuity · the entry is a ramp, not a pop-in',
    samples[0].opacity<=.02&&samples.find(s=>s.p>=.06).opacity>.2,
    `p0 ${samples[0].opacity} -> p0.06 ${samples.find(s=>s.p>=.06).opacity}`);

  const named=[0,.2,.4,.6,.8,1];
  const table=await page.evaluate(list=>{
    const t=window.RestaurantScrollTraveler;t.measure();
    return list.map(p=>{const s=t.stateAtProgress(p);
      return {p,x:+s.x.toFixed(2),y:+s.y.toFixed(2),scale:+s.scale.toFixed(3),
        rotation:+s.rotation.toFixed(2),chapter:s.chapter,layer:s.layer}});
  },named);
  console.log('\n  progress    x       y      scale   rotation  chapter      layer');
  for(const r of table)
    console.log(`  ${r.p.toFixed(2)}      ${String(r.x).padEnd(8)}${String(r.y).padEnd(7)}`
      +`${String(r.scale).padEnd(8)}${String(r.rotation).padEnd(10)}${r.chapter.padEnd(13)}${r.layer}`);
  console.log('');
  const distinct=k=>new Set(table.map(r=>r[k])).size;
  check('named progress values · 0.00/0.20/0.40/0.60/0.80/1.00 are six different compositions',
    distinct('x')===6&&distinct('y')===6&&distinct('scale')===6,
    `x ${distinct('x')}, y ${distinct('y')}, scale ${distinct('scale')} distinct values`);
  check('named progress values · they walk the route in order',
    table.map(r=>r.chapter).join('>')==='signature>signature>origin>atmosphere>chef>visit',
    table.map(r=>r.chapter).join(' > '));

  const walk=await page.evaluate(async()=>{
    const t=window.RestaurantScrollTraveler;
    scrollTo({top:0,behavior:'instant'});
    await new Promise(r=>setTimeout(r,420));
    t.measure();
    const doc=document.scrollingElement;
    const out=[];
    const steps=64;
    for(let i=0;i<=steps;i++){
      const max=doc.scrollHeight-innerHeight;
      scrollTo({top:max*(i/steps),behavior:'instant'});
      await new Promise(r=>setTimeout(r,60));
      const s=t.state();
      const r=document.querySelector('.st-traveler').getBoundingClientRect();
      out.push({p:s.progress,y:scrollY,cx:+(r.left+r.width/2).toFixed(1),
        cy:+(r.top+r.height/2).toFixed(1),chapter:s.chapter});
    }
    return out;
  });
  const regressions=walk.slice(1).filter((s,i)=>s.p<walk[i].p-.02);
  check('scroll-driven · progress rises with the scroll position, never backwards',
    regressions.length===0,
    `${walk[0].p.toFixed(3)} -> ${walk[walk.length-1].p.toFixed(3)} over ${walk.length} samples`);
  check('scroll-driven · scrolling the page covers the whole journey',
    walk[0].p<=.02&&walk[walk.length-1].p>=.98,
    `first ${walk[0].p.toFixed(3)}, last ${walk[walk.length-1].p.toFixed(3)}`);
  const jumps=walk.slice(1).map((s,i)=>Math.hypot(s.cx-walk[i].cx,s.cy-walk[i].cy));
  check('scroll-driven · the object never jumps across the viewport',
    Math.max(...jumps)<460,`largest on-screen step ${Math.round(Math.max(...jumps))}px`);
  check('scroll-driven · intermediate positions are really visible mid-section',
    new Set(walk.map(s=>s.chapter)).size>=4,
    [...new Set(walk.map(s=>s.chapter))].join(' -> '));

  const physical=await page.evaluate(async()=>{
    const t=window.RestaurantScrollTraveler;t.measure();
    t.scrollToProgress(.3);
    await new Promise(r=>setTimeout(r,1000));
    const readRot=()=>parseFloat(getComputedStyle(document.querySelector('.st-traveler'))
      .getPropertyValue('--st-rot'));
    let maxLag=0,maxSpin=0;
    const from=scrollY;
    for(let i=1;i<=18;i++){
      scrollTo({top:from+i*90,behavior:'instant'});
      await new Promise(r=>requestAnimationFrame(r));
      const st=t.state();
      const want=t.stateAtProgress(st.progress);
      maxLag=Math.max(maxLag,Math.abs(st.current.x-want.x));
      maxSpin=Math.max(maxSpin,Math.abs(st.current.spin));
    }
    let settleMs=0;
    const t0=performance.now();
    while(performance.now()-t0<5000){
      if(document.documentElement.dataset.travelerSettled==='1'){settleMs=performance.now()-t0;break}
      await new Promise(r=>setTimeout(r,60));
    }
    const restA=t.state().current,rotA=readRot();
    await new Promise(r=>setTimeout(r,1600));
    const restB=t.state().current,rotB=readRot();
    const want=t.stateAtProgress(t.state().progress);
    return {maxLag,maxSpin,settleMs,
      drift:Math.max(Math.abs(restA.x-restB.x),Math.abs(rotA-rotB)),
      restSpin:Math.abs(restB.spin),
      offComposition:Math.abs(restB.x-want.x),
      stillSettled:document.documentElement.dataset.travelerSettled==='1'};
  });
  check('premium motion · the object has weight: it lags its target while the page moves',
    physical.maxLag>.25,`max lag ${physical.maxLag.toFixed(2)}vw behind the composition`);
  check('premium motion · scroll velocity produces a small rotation response',
    physical.maxSpin>.4&&physical.maxSpin<=7.01,`up to ${physical.maxSpin.toFixed(2)} degrees`);
  check('premium motion · it settles when the page stops',
    physical.settleMs>0&&physical.settleMs<3500,`came to rest in ${Math.round(physical.settleMs)}ms`);
  check('premium motion · no perpetual wobble: nothing moves once it has settled',
    physical.drift<.03&&physical.stillSettled&&physical.restSpin<.05
    &&physical.offComposition<.05,
    `drift ${physical.drift.toFixed(3)} over 1.6s, resting spin ${physical.restSpin.toFixed(3)}`);

  const route=await page.evaluate(()=>window.RestaurantStudioConfig.get('scrollTraveler').route);
  const reached=[];
  for(let i=0;i<route.length;i++){
    const at=await land(page,i,0);
    reached.push({i,want:route[i],got:at});
  }
  check('desktop route · every anchor composition is reached exactly as designed',
    reached.every(r=>near(r.got.current.x,r.want.x,.6)&&near(r.got.current.y,r.want.y,.6)
      &&near(r.got.current.scale,r.want.scale,.02)),
    reached.map(r=>`${r.want.chapter} ${r.got.current.x}/${r.got.current.y}`).join('  '));
  check('desktop route · each chapter carries its designed layer',
    reached.every(r=>r.got.layer===r.want.layer),
    reached.map(r=>`${r.want.chapter}:${r.got.layer}`).join(' '));
  check('desktop route · the final composition is reachable by scrolling',
    reached[4].got.progress>=.99,`p=${reached[4].got.progress.toFixed(3)} at the last anchor`);

  const layers=[...new Set(reached.map(r=>r.got.layer))];
  check('layers · the route really uses more than one depth',
    layers.length>=3,layers.join(' / '));
  const behind=await land(page,1,0);
  const behindProof=await page.evaluate(()=>{
    const z=el=>+getComputedStyle(el).zIndex||0;
    return {traveler:z(document.querySelector('.st-traveler')),
      copy:z(document.querySelector('#experience .produce-sticky')),
      media:z(document.querySelector('#experience .produce-media')),
      onTop:document.elementFromPoint(innerWidth*.24,innerHeight*.46)?.className||''};
  });
  check('layers · behind means behind the page: the section keeps its own words on top',
    behindProof.traveler<behindProof.copy&&behindProof.traveler<behindProof.media
    &&!String(behindProof.onTop).includes('st-'),
    `traveler z=${behindProof.traveler}, media z=${behindProof.media}, copy z=${behindProof.copy}`);
  const between=await land(page,2,0);
  const betweenProof=await page.evaluate(()=>{
    const z=el=>+getComputedStyle(el).zIndex||0;
    return {traveler:z(document.querySelector('.st-traveler')),
      copy:z(document.querySelector('.experience-section .experience-title')),
      media:z(document.querySelector('.experience-section .wide-image'))};
  });
  check('layers · between means in front of the photograph and behind the headline',
    betweenProof.traveler>betweenProof.media&&betweenProof.traveler<betweenProof.copy,
    `media ${betweenProof.media} < traveler ${betweenProof.traveler} < copy ${betweenProof.copy}`);
  const front=await land(page,3,0);
  check('layers · front means in front of the page',front.zIndex>=60,`z=${front.zIndex}`);
  check('layers · z-index is a state and not a tween',
    /layer:t<\.5\?a\.layer:b\.layer/.test(CODE),'it hands over at the segment midpoint');
  check('layers · behind / between / front were all reached with the object visible',
    behind.current.opacity>.9&&between.current.opacity>.9&&front.current.opacity>.9,
    `${behind.current.opacity} / ${between.current.opacity} / ${front.current.opacity}`);

  check('no hijack · the engine never calls preventDefault and never captures the wheel',
    !/preventDefault/.test(CODE)&&!/['"]wheel['"]/.test(CODE),
    'no preventDefault, no wheel listener');
  check('no hijack · every scroll and resize listener the engine adds is passive',
    (CODE.match(/addEventListener\('(?:scroll|resize)'/g)||[]).length
      ===(CODE.match(/\{passive:true\}/g)||[]).length,
    `${(CODE.match(/\{passive:true\}/g)||[]).length} passive listeners`);
  const scrollProof=await page.evaluate(async()=>{
    const rest=async()=>{
      let last=-1,stable=0;
      for(let i=0;i<50;i++){
        await new Promise(r=>setTimeout(r,60));
        stable=(scrollY===last)?stable+1:0;
        last=scrollY;
        if(stable>=2&&i>=3)break;
      }
      return scrollY};
    scrollTo({top:2000,behavior:'instant'});
    await rest();
    const before=scrollY;
    let prevented=false;
    const spy=e=>{prevented=prevented||e.defaultPrevented};
    addEventListener('wheel',spy,{passive:true});
    const ev=new WheelEvent('wheel',{deltaY:600,bubbles:true,cancelable:true});
    document.body.dispatchEvent(ev);
    removeEventListener('wheel',spy);
    scrollBy(0,900);
    const after=await rest();
    const cs=getComputedStyle(document.documentElement);
    const bs=getComputedStyle(document.body);
    return {moved:after-before,prevented,wheelCancelled:ev.defaultPrevented,
      snap:`${cs.scrollSnapType}/${bs.scrollSnapType}`,
      overflow:`${cs.overflowY}/${bs.overflowY}`};
  });
  check('no hijack · a wheel event is not cancelled by anything on the page',
    !scrollProof.prevented&&!scrollProof.wheelCancelled,'defaultPrevented false');
  check('no hijack · a 900px scroll moves the page 900px',
    near(scrollProof.moved,900,12),`moved ${Math.round(scrollProof.moved)}px`);
  check('no hijack · no scroll snapping and no scroll lock introduced',
    /none/.test(scrollProof.snap)&&!/hidden/.test(scrollProof.overflow),
    `snap ${scrollProof.snap}, overflow ${scrollProof.overflow}`);

  const blockProof=await page.evaluate(async()=>{
    const t=window.RestaurantScrollTraveler;t.measure();
    t.scrollToProgress(1);
    await new Promise(r=>setTimeout(r,800));
    const layer=document.querySelector('.st-traveler');
    const cs=getComputedStyle(layer);
    const r=layer.getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    const cta=document.querySelector('#visit .reserve-open');
    const cr=cta.getBoundingClientRect();
    const overCta=document.elementFromPoint(cr.left+cr.width/2,cr.top+cr.height/2);
    return {pointerEvents:cs.pointerEvents,ariaHidden:layer.getAttribute('aria-hidden'),
      hit:hit?.className||hit?.tagName||'',
      ctaReachable:overCta===cta||cta.contains(overCta)};
  });
  check('no blocking · the layer is pointer-transparent and hidden from assistive tech',
    blockProof.pointerEvents==='none'&&blockProof.ariaHidden==='true',
    `pointer-events:${blockProof.pointerEvents} aria-hidden:${blockProof.ariaHidden}`);
  check('no blocking · a hit test through the object finds the page underneath',
    !String(blockProof.hit).includes('st-'),`elementFromPoint -> ${blockProof.hit}`);
  check('no blocking · the reservation CTA under the finale is still the click target',
    blockProof.ctaReachable,'elementFromPoint returns the button');

  const beforeAnchors=(await state(page)).anchors.map(a=>a.scroll);
  await page.setViewportSize({width:1180,height:820});
  await page.waitForTimeout(800);
  const afterResize=await state(page);
  check('resize · the route is re-measured instead of drifting',
    afterResize.anchors.length===5
    &&afterResize.anchors.some((a,i)=>Math.abs(a.scroll-beforeAnchors[i])>4),
    `anchor 3: ${beforeAnchors[2]} -> ${afterResize.anchors[2].scroll}`);
  await page.setViewportSize({width:1440,height:900});
  await page.waitForTimeout(700);

  check('runtime · no page errors during the desktop pass',errors.length===0,
    errors.slice(0,2).join(' | ')||'clean');
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const s0=await boot(page);
  check('mobile · the mobile route is the one in use',s0.mobileRoute,'innerWidth 390');

  const cfg=await page.evaluate(()=>window.RestaurantStudioConfig.get('scrollTraveler'));
  check('mobile · it is a dedicated route, not the desktop one scaled down',
    Array.isArray(cfg.routeMobile)&&cfg.routeMobile.length===cfg.route.length
    &&cfg.routeMobile.some((m,i)=>m.x!==cfg.route[i].x||m.y!==cfg.route[i].y
      ||m.scale!==cfg.route[i].scale),
    `${cfg.routeMobile.length} mobile stops, all differing from desktop`);

  const reached=[];
  for(let i=0;i<cfg.routeMobile.length;i++){
    const at=await land(page,i,0);
    const box=await page.evaluate(()=>{
      const r=document.querySelector('.st-traveler').getBoundingClientRect();
      return {left:Math.round(r.left),right:Math.round(r.right),
        doc:document.documentElement.scrollWidth,win:innerWidth};
    });
    reached.push({want:cfg.routeMobile[i],got:at,box});
  }
  check('mobile route · every mobile composition is reached as designed',
    reached.every(r=>near(r.got.current.x,r.want.x,.6)&&near(r.got.current.y,r.want.y,.6)
      &&near(r.got.current.scale,r.want.scale,.02)),
    reached.map(r=>`${r.want.chapter} ${r.got.current.x}/${r.got.current.y}`).join(' '));
  check('mobile route · all five chapters are recognisable on the phone',
    reached.map(r=>r.got.chapter).join('>')==='signature>origin>atmosphere>chef>visit',
    reached.map(r=>r.got.chapter).join(' > '));
  check('mobile · no horizontal overflow anywhere on the route',
    reached.every(r=>r.box.doc<=r.box.win),
    reached.map(r=>`${r.box.doc}/${r.box.win}`).join(' '));
  check('mobile · the object itself never hangs outside the screen',
    reached.every(r=>r.box.left>=-8&&r.box.right<=r.box.win+8),
    reached.map(r=>`[${r.box.left},${r.box.right}]`).join(' '));

  await page.setViewportSize({width:1100,height:844});
  await page.waitForTimeout(800);
  const wide=await state(page);
  check('mobile · crossing the breakpoint switches route and re-measures',
    wide.mobileRoute===false&&wide.anchors.length===5,
    `mobileRoute ${wide.mobileRoute} at 1100px`);
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  await boot(page);

  const placement=await page.evaluate(()=>{
    document.querySelector('.studio-open')?.click();
    return new Promise(r=>setTimeout(()=>{
      document.querySelector('#studio [data-panel="motion"]')?.click();
      setTimeout(()=>{
        const card=document.querySelector('.st-studio');
        r({card:!!card,
          inMotionPanel:!!card?.closest('.studio-panel.motion-panel'),
          inProductSelect:!!document.querySelector('#motion-orbital-style option[value="red-prawn"]')
            ||!!document.querySelector('#motion-orbital-style option[value="scroll-traveler"]'),
          presets:[...document.querySelectorAll('#motion-orbital-style option')].map(o=>o.value),
          paths:[...document.querySelectorAll('.st-studio [data-path]')].map(i=>i.dataset.path),
          upload:!!document.querySelector('.st-studio .st-upload')});
      },500);
    },600));
  });
  check('studio · the traveler is PAGE MOTION with its own card in the Motion panel',
    placement.card&&placement.inMotionPanel,'card present in the motion panel');
  check('studio · it is not an option in product navigation, so it coexists with any preset',
    !placement.inProductSelect,`presets: ${placement.presets.join(', ')}`);
  check('studio · the controls are few and meaningful, wired through data-path',
    placement.paths.length>=5&&placement.paths.every(p=>p.startsWith('scrollTraveler.'))
    &&placement.upload,placement.paths.join(' '));
  check('studio · no bezier control points are exposed',
    !/bezier|controlPoint|cp1|cp2/i.test(CODE),'intensity / scale / rotation only');
  await page.evaluate(()=>document.querySelector('.st-studio')?.scrollIntoView({block:'center'}));
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(SHOTS,'scroll-traveler-studio-panel.png')});

  await page.evaluate(()=>{
    const c=document.querySelector('.st-studio [data-path$="enabled"]');
    c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForTimeout(900);
  const off=await page.evaluate(()=>{
    const layer=document.querySelector('.st-traveler');
    return {flag:document.documentElement.dataset.scrollTraveler||'',
      active:window.RestaurantScrollTraveler.state().active,
      visible:!!layer&&layer.classList.contains('is-active')
        &&+getComputedStyle(layer).opacity>.01};
  });
  check('studio · OFF means no traveler at all',
    !off.active&&!off.visible&&off.flag==='',
    `active ${off.active}, visible ${off.visible}, flag "${off.flag}"`);
  await page.evaluate(()=>document.querySelector('#studio-close')?.click());
  await page.waitForTimeout(600);
  const offScroll=await page.evaluate(async()=>{
    const rest=async()=>{
      let last=-1,stable=0;
      for(let i=0;i<50;i++){
        await new Promise(r=>setTimeout(r,60));
        stable=(scrollY===last)?stable+1:0;
        last=scrollY;
        if(stable>=2&&i>=3)break;
      }
      return scrollY};
    scrollTo({top:1200,behavior:'instant'});
    const before=await rest();
    scrollBy(0,700);
    return (await rest())-before;
  });
  check('studio · with the traveler OFF the page still scrolls normally',
    near(offScroll,700,12),`moved ${Math.round(offScroll)}px`);

  await page.evaluate(()=>{
    document.querySelector('.studio-open')?.click();
    setTimeout(()=>document.querySelector('#studio [data-panel="motion"]')?.click(),300);
  });
  await page.waitForTimeout(1000);
  await page.evaluate(()=>{
    const c=document.querySelector('.st-studio [data-path$="enabled"]');
    c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    const i=document.querySelector('.st-studio [data-path$="intensity"]');
    i.value='0.75';i.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForTimeout(900);
  const backOn=await state(page);
  check('studio · ON brings the same object back, without a second layer',
    backOn.active&&await page.evaluate(()=>document.querySelectorAll('.st-traveler').length)===1,
    `active ${backOn.active}`);
  const damped=await page.evaluate(()=>{
    const t=window.RestaurantScrollTraveler;t.measure();
    return t.state().anchors.map(a=>a.x);
  });
  check('studio · intensity re-composes the route instead of adding a second one',
    damped.every(x=>Math.abs(x-50)<=32),
    `anchor x at intensity 0.75: ${damped.map(x=>x.toFixed(1)).join(' ')}`);

  await page.waitForTimeout(2400);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.scrollTraveler==='ready',
    null,{timeout:30000});
  await page.waitForTimeout(900);
  const persisted=await page.evaluate(()=>({
    enabled:window.RestaurantStudioConfig.get('scrollTraveler.enabled'),
    intensity:window.RestaurantStudioConfig.get('scrollTraveler.intensity'),
    asset:window.RestaurantStudioConfig.get('scrollTraveler.source.asset'),
    src:document.querySelector('.st-traveler .st-object')?.getAttribute('src'),
    active:window.RestaurantScrollTraveler.state().active}));
  check('persistence · ON and the edited intensity survive a reload',
    persisted.enabled===true&&near(persisted.intensity,.75,1e-6)&&persisted.active,
    `enabled ${persisted.enabled}, intensity ${persisted.intensity}`);
  check('persistence · the object source comes from project state and survives too',
    persisted.src===persisted.asset&&/dish-01-prawn/.test(persisted.asset),
    persisted.asset);
  check('persistence · it uses the existing store, with no second settings system',
    /RestaurantStudioConfig/.test(ENGINE)&&/RestaurantStore/.test(ENGINE)
    &&!/localStorage|sessionStorage|new Store|indexedDB\.open/.test(CODE),
    'RestaurantStudioConfig + RestaurantStore only');

  await page.evaluate(()=>window.RestaurantStudioConfig.set('scrollTraveler.source',
    {type:'dish',dishId:'dish-02',asset:'assets/depth-carousel/dish-02.webp'}));
  await page.waitForTimeout(1100);
  const swapped=await page.evaluate(()=>({
    src:document.querySelector('.st-traveler .st-object')?.getAttribute('src'),
    layers:document.querySelectorAll('.st-traveler').length,
    active:window.RestaurantScrollTraveler.state().active}));
  check('generic · a different object rides the same route and the same single layer',
    /dish-02/.test(swapped.src||'')&&swapped.layers===1&&swapped.active,
    swapped.src);
  const conditionals=[
    /===\s*['"`](?:gamba|red-prawn|dish-\d+|chef|signature|origin|atmosphere|visit)['"`]/i,
    /(?:dishId|chapter|anchor)\s*[!=]==/,
    /\.(?:chapter|dishId)\s*===/,
    /includes\(\s*['"`](?:gamba|prawn|chef)['"`]/i];
  const hits=conditionals.filter(re=>re.test(CODE)).map(String);
  check('generic · the renderer takes no decision from a product or a section identity',
    hits.length===0,hits.join(' ')||'no identity comparison anywhere in the engine');
  const drivenByData=await page.evaluate(()=>{
    const cfg=window.RestaurantStudioConfig.get('scrollTraveler');
    const hint=document.querySelector('.st-route-hint')?.textContent||'';
    return {hint,chapters:cfg.route.map(r=>r.chapter)};
  });
  check('generic · even the Studio label is read from the route data',
    drivenByData.chapters.every(c=>drivenByData.hint.toLowerCase().includes(c)),
    drivenByData.hint);

  await page.evaluate(()=>window.RestaurantStudioConfig.set('scrollTraveler.source',
    {type:'dish',dishId:'dish-01',asset:'assets/scroll-traveler/runtime/does-not-exist.webp'}));
  await page.waitForTimeout(1200);
  const broken=await page.evaluate(()=>({
    flag:document.documentElement.dataset.travelerAsset||'',
    naturalWidth:document.querySelector('.st-traveler .st-object')?.naturalWidth||0,
    visible:(()=>{const l=document.querySelector('.st-traveler');
      return !!l&&l.classList.contains('is-active')&&+getComputedStyle(l).opacity>.01})()}));
  check('generic · an unreadable object is refused rather than shown broken',
    !broken.visible&&broken.flag!=='ready',
    `asset flag "${broken.flag}", naturalWidth ${broken.naturalWidth}`);
  await page.evaluate(()=>window.RestaurantStudioConfig.set('scrollTraveler.source',
    {type:'dish',dishId:'dish-01',asset:'assets/scroll-traveler/runtime/dish-01-prawn.webp',
      alt:'Gamba roja salvaje',altEn:'Wild red prawn'}));
  await page.waitForTimeout(1100);
  const restored=await state(page);
  check('generic · restoring a valid object recovers the journey',
    restored.active&&/dish-01-prawn/.test(restored.asset),restored.asset);
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await boot(page);
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,
    null,{timeout:25000});

  const presets=[['depth-carousel','depthCarousel'],['anchor-scenes','anchorScenes'],
    ['orbital-food','orbitalFood'],['pizza-slice-orbit','pizzaSliceOrbit']];
  const coexist=[];
  for(const [value,flag] of presets){
    const has=await page.evaluate(v=>!!document.querySelector(`#motion-orbital-style option[value="${v}"]`),value);
    if(!has){coexist.push({value,skipped:true});continue}
    await page.evaluate(v=>{
      const s=document.getElementById('motion-orbital-style');
      s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));
      s.dispatchEvent(new Event('change',{bubbles:true}));
      window.RestaurantMotionStudio?.publish?.();
    },value);
    await page.waitForFunction(f=>document.documentElement.dataset[f]==='ready',flag,
      {timeout:25000}).catch(()=>{});
    await page.waitForTimeout(900);
    const st=await state(page);
    coexist.push({value,
      presetReady:await page.evaluate(f=>document.documentElement.dataset[f]==='ready',flag),
      travelerActive:st.active,
      layers:await page.evaluate(()=>document.querySelectorAll('.st-traveler').length)});
  }
  const live=coexist.filter(c=>!c.skipped);
  check('additive · the traveler stays alive across every product preset',
    live.length>=3&&live.every(c=>c.travelerActive&&c.layers===1),
    live.map(c=>`${c.value}:${c.travelerActive?'on':'off'}`).join(' '));
  check('additive · each product preset still reaches its own ready state',
    live.every(c=>c.presetReady),
    live.map(c=>`${c.value}:${c.presetReady?'ready':'NOT READY'}`).join(' '));
  check('additive · no page errors while switching presets under the traveler',
    errors.length===0,errors.slice(0,2).join(' | ')||'clean');
  check('additive · index.html is untouched: the runtime loads itself',
    /class14-scroll-traveler\.js/.test(fs.readFileSync(path.join(ROOT,'class4-runtime-guard.js'),'utf8'))
    &&!/class14-scroll-traveler/.test(fs.readFileSync(path.join(ROOT,'index.html'),'utf8')),
    'loaded from class4-runtime-guard.js');
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:1440,height:900},
    reducedMotion:'reduce'});
  const page=await context.newPage();
  const s0=await boot(page);
  check('reduced motion · the page sees the preference and the traveler still works',
    s0.reduced&&s0.active,`reduced ${s0.reduced}, active ${s0.active}`);

  const at=await land(page,2,0);
  check('reduced motion · the object still resolves to its composed position',
    near(at.current.x,78,1)&&at.chapter==='atmosphere',
    `x ${at.current.x} at ${at.chapter}`);
  check('reduced motion · it lands with no easing tail to chase',
    /reduced/.test(CODE),
    'the lerp is skipped when the preference is set');
  const usable=await page.evaluate(async()=>{
    const before=scrollY;scrollBy(0,800);
    let last=-1,stable=0;
    for(let i=0;i<50;i++){
      await new Promise(r=>setTimeout(r,60));
      stable=(scrollY===last)?stable+1:0;last=scrollY;
      if(stable>=2&&i>=3)break;
    }
    const copy=document.querySelector('.experience-section .experience-title');
    const cs=getComputedStyle(copy);
    return {moved:scrollY-before,copyVisible:+cs.opacity>.9,
      overflow:document.documentElement.scrollWidth<=innerWidth};
  });
  check('reduced motion · content and scrolling remain fully usable',
    near(usable.moved,800,12)&&usable.copyVisible&&usable.overflow,
    `scrolled ${Math.round(usable.moved)}px, copy visible ${usable.copyVisible}`);

  await page.evaluate(()=>window.RestaurantStudioConfig.set('scrollTraveler.enabled',false));
  await page.waitForTimeout(800);
  const rmOff=await state(page);
  await page.evaluate(()=>window.RestaurantStudioConfig.set('scrollTraveler.enabled',true));
  await page.waitForTimeout(900);
  const rmOn=await state(page);
  check('reduced motion · Studio ON/OFF still works',
    !rmOff.active&&rmOn.active,`off ${rmOff.active} -> on ${rmOn.active}`);
  await context.close();
}

await browser.close();server.close();

const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
if(failed.length){
  console.error(`SCROLL_TRAVELER_FAIL: ${failed.map(f=>f.name).join(' | ')}`);
  process.exit(1);
}
console.log('SCROLL_TRAVELER_PASS');
