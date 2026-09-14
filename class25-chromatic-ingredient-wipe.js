/* CLASS 25 · CHROMATIC INGREDIENT WIPE

   A cinematic product engine: a giant cut ingredient physically travels across the
   composition, occludes the hero at midpoint, and while it hides the swap the whole
   stage changes chromatic world — background, giant title and hero all belong to the
   next product when the ingredient exits the opposite edge.

   ONE NORMALIZED PROGRESS drives every layer analytically (no independent animations):
     p 0.00–0.15 ANTICIPATE · 0.15–0.42 INGREDIENT ENTERS · 0.42–0.58 OCCLUSION / WORLD SWAP
     0.58–0.88 EXIT / REVEAL · 0.88–1.00 SETTLE

   DATA IS NOT DUPLICATED:
     dishes → RestaurantOrbit.getDishes() (live Project State collection)
     pizzas → RestaurantStudioConfig.get('pizzaSliceOrbit').products + Project 07 manifest
   Chromatic worlds come from each product's existing accent / backgroundColor.
   The transition ingredient is an OPTIONAL `transitionMediaRef` resolved through the shared
   RestaurantMedia / RestaurantMediaPicker; when absent it falls back to the product hero.

   No new store, no second Media Library, no second Studio. Source + intensity + duration +
   media live in normal Project State fields under `motion.*`. `?review=chromatic-wipe
   [&source=pizzas]` only overrides presentation in memory; it never writes project state.
*/
(() => {
  'use strict';
  const MODE='chromatic-ingredient-wipe';
  const REVIEW_KEY='chromatic-wipe';
  const MANIFEST_URL='assets/pizza-motion/slices-manifest.json';
  const INTERACTIVE='button,a,input,select,textarea,label,[role="button"]';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const params=new URLSearchParams(location.search);
  const review=params.get('review')===REVIEW_KEY;
  const reviewSource=params.get('source')==='pizzas'?'pizzas':'dishes';
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const normalize=(v,n)=>n?((v%n)+n)%n:0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  /* eased interpolation helpers */
  const smooth=(e0,e1,x)=>{const t=clamp((x-e0)/((e1-e0)||1),0,1);return t*t*(3-2*t)};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const hex3=h=>{const m=/^#?([\da-f]{3}|[\da-f]{6})$/i.exec(String(h||'').trim());if(!m)return null;
    let s=m[1];if(s.length===3)s=s.replace(/./g,c=>c+c);return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)]};
  const toHex=n=>clamp(Math.round(n),0,255).toString(16).padStart(2,'0');
  const mixColor=(a,b,t)=>{const pa=hex3(a),pb=hex3(b);if(!pa||!pb)return t<.5?a:b;
    return `#${toHex(lerp(pa[0],pb[0],t))}${toHex(lerp(pa[1],pb[1],t))}${toHex(lerp(pa[2],pb[2],t))}`};

  const INTENSITY={suave:{sweep:108,peak:1.42,rot:5,heroDip:.90,blur:4},
    cinematica:{sweep:128,peak:1.68,rot:8,heroDip:.84,blur:7},
    intensa:{sweep:150,peak:1.95,rot:12,heroDip:.78,blur:10}};

  let section=null,shell=null,stage=null,worldA=null,worldB=null,titleA=null,titleB=null;
  let heroA=null,heroB=null,heroFloor=null,decorWrap=null,ingredient=null,vignette=null;
  let sourceBadge=null,meta=null,titleSmall=null,desc=null,counter=null,detailBtn=null,prevBtn=null,nextBtn=null;
  let hint=null,studioCard=null;
  let items=[],pizzaManifest=null,active=-1,ready=false,mounted=false,tween=null;
  let progress=0,transitioning=false,dir=0,fromIndex=0,toIndex=0,pending=null;
  let frontWorld='a',frontHero='a',frontTitle='a',lastSignature='',lastSource='',refreshQueued=false;
  let dragging=false,pointerId=null,startX=0,startY=0,lastX=0,lastT=0,velocity=0,axis='',scrubDir=0;
  let shellTouchAction='',suppressArrowClickUntil=0;
  const observers=new Set();
  const mediaUrlCache=new Map();

  const isWipe=()=>root.dataset.orbitalMotion===MODE;
  const isMobile=()=>innerWidth<760;
  const source=()=>review?reviewSource:
    (window.RestaurantStudioConfig?.get?.('motion.chromaticWipeSource')==='pizzas'?'pizzas':'dishes');
  const intensityKey=()=>{const v=window.RestaurantStudioConfig?.get?.('motion.chromaticWipeIntensity');
    return v==='suave'||v==='intensa'?v:'cinematica'};
  const durationMs=()=>{const v=+window.RestaurantStudioConfig?.get?.('motion.chromaticWipeDuration');
    return v>=500&&v<=1600?v:950};
  const cfg=()=>INTENSITY[intensityKey()]||INTENSITY.cinematica;

  /* ---------- data adapters (shared Project State, never duplicated) ---------- */
  async function loadManifest(){
    if(pizzaManifest)return pizzaManifest;
    try{const r=await fetch(MANIFEST_URL,{cache:'force-cache'});if(!r.ok)throw new Error(r.status);pizzaManifest=await r.json()}
    catch(e){console.error('[chromatic-wipe] pizza manifest unavailable',e);pizzaManifest={slices:[]}}
    return pizzaManifest;
  }
  function liveDishImage(d){
    const el=$(`#orbit-stage .orbit-dish[data-id="${CSS.escape(String(d.id||''))}"] img`);
    return el?.currentSrc||el?.src||d?.depthCarousel?.asset||d?.image||'';
  }
  function dishItems(){
    const list=window.RestaurantOrbit?.getDishes?.()||window.RestaurantStudioConfig?.snapshot?.().dishes||[];
    return list.filter(d=>d&&d.enabled!==false).map((d,i)=>{
      const dc=d.depthCarousel||{},of=d.orbitalFood||{};
      const decor=[dc.backgroundDecor,...(dc.foregroundDecor||[])].filter(Boolean).slice(0,3);
      return {id:d.id||`dish-${i}`,name:d.name||`Plato ${i+1}`,
        word:(dc.word||of.word||d.name||'').toString().toUpperCase(),
        meta:d.meta||'',description:d.short||'',ingredients:d.ingredients||'',price:d.price||'',
        image:dc.asset||liveDishImage(d)||d.image||'',accent:dc.accent||of.accent||window.RestaurantStudioConfig?.get?.('brand.accent')||'#ff6a3c',
        bg:dc.backgroundColor||'#0b0b09',decor,transitionMediaRef:d.transitionMediaRef||'',kind:'dish',raw:d};
    });
  }
  function pizzaItems(){
    const c=window.RestaurantStudioConfig?.get?.('pizzaSliceOrbit')||window.RestaurantDefaults?.pizzaSliceOrbit||{};
    const slices=pizzaManifest?.slices||[];const byId=new Map(slices.map(s=>[s.id,s]));
    return (c.products||[]).filter(p=>p&&p.available!==false).map((p,i)=>{
      const s=byId.get(p.id)||slices[i]||{};const bg=p.background||{};
      return {id:p.id||s.id||`pizza-${i}`,name:p.name||s.name||`Pizza ${i+1}`,
        word:(p.name||s.name||'').toString().toUpperCase(),
        meta:p.descriptor||p.mood||'',description:p.headlineTail||'',ingredients:p.ingredients||'',
        price:p.price??'',image:s.runtimeAsset||'',accent:p.accent||c.brand?.accent||'#f0c96a',
        bg:bg.a||'#140d06',decor:[],transitionMediaRef:p.transitionMediaRef||'',kind:'pizza',raw:p};
    });
  }
  function signature(list,src){
    return `${src}|${intensityKey()}|${list.map(x=>[x.id,x.name,x.word,x.meta,x.description,x.price,x.image,x.accent,x.bg,x.transitionMediaRef,(x.decor||[]).join(',')].join('~')).join('|')}`;
  }
  async function resolveMedia(ref,fallback){
    if(!ref)return fallback||'';
    if(mediaUrlCache.has(ref))return mediaUrlCache.get(ref);
    let url='';try{url=await window.RestaurantMedia?.url?.(ref)||''}catch{}
    if(!url)url=window.RestaurantMediaResolve?.(ref)||fallback||'';
    if(url)mediaUrlCache.set(ref,url);
    return url||fallback||'';
  }
  async function wipeMediaFor(item){return resolveMedia(item?.transitionMediaRef,item?.image)}

  async function loadItems({reset=false}={}){
    const src=source();
    if(src==='pizzas')await loadManifest();
    const next=src==='pizzas'?pizzaItems():dishItems();
    const sig=signature(next,src);
    if(!reset&&sig===lastSignature)return false;
    lastSignature=sig;lastSource=src;items=next;
    if(reset||!items.length)progress=0;
    active=-1;
    await renderImmediate(indexAtRest());syncStudio();
    return true;
  }
  /* `progress` is the TRANSITION scalar (0→1 per wipe), never a position. The committed
     product is `active`; at rest the index is `active`, before first render it is 0. */
  const indexAtRest=()=>active>=0?normalize(active,items.length):normalize(Math.round(progress),items.length);

  /* ---------- stage ---------- */
  function ensureStyles(){
    if($('link[data-chromatic-wipe-styles]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='styles-v25.css';
    l.dataset.chromaticWipeStyles='1';document.head.appendChild(l);
  }
  function injectOption(){
    const s=$('#motion-orbital-style');if(!s)return false;
    if(!s.querySelector(`option[value="${MODE}"]`)){
      const o=document.createElement('option');o.value=MODE;o.textContent='Chromatic Ingredient Wipe';s.appendChild(o);
    }
    return true;
  }
  function ensureStage(){
    section=section||$('.orbital-section');shell=shell||$('.orbit-shell');
    if(!section||!shell)return false;
    if(stage?.isConnected)return true;
    stage=document.createElement('div');stage.className='cw-stage';stage.tabIndex=0;
    stage.setAttribute('aria-label','Escenario de producto cromático. Arrastra en horizontal o usa las flechas.');
    stage.innerHTML=`
      <div class="cw-world cw-world-a" aria-hidden="true"></div>
      <div class="cw-world cw-world-b" aria-hidden="true"></div>
      <div class="cw-vignette" aria-hidden="true"></div>
      <h2 class="cw-giant cw-giant-a" aria-hidden="true"></h2>
      <h2 class="cw-giant cw-giant-b" aria-hidden="true"></h2>
      <div class="cw-decor" aria-hidden="true"></div>
      <div class="cw-hero" aria-hidden="true"><div class="cw-hero-floor"></div>
        <img class="cw-hero-img cw-hero-a" alt=""><img class="cw-hero-img cw-hero-b" alt=""></div>
      <div class="cw-copy">
        <p class="cw-source"></p><p class="cw-meta"></p>
        <h3 class="cw-name"></h3><p class="cw-desc"></p>
        <div class="cw-copy-foot"><span class="cw-counter"></span>
          <button type="button" class="cw-detail">Ver producto +</button></div>
      </div>
      <img class="cw-ingredient" alt="" aria-hidden="true">
      <button type="button" class="cw-arrow cw-prev" aria-label="Producto anterior">←</button>
      <button type="button" class="cw-arrow cw-next" aria-label="Producto siguiente">→</button>
      <p class="cw-hint">ARRASTRA · FLECHAS</p>`;
    shell.appendChild(stage);
    worldA=$('.cw-world-a',stage);worldB=$('.cw-world-b',stage);vignette=$('.cw-vignette',stage);
    titleA=$('.cw-giant-a',stage);titleB=$('.cw-giant-b',stage);decorWrap=$('.cw-decor',stage);
    heroA=$('.cw-hero-a',stage);heroB=$('.cw-hero-b',stage);heroFloor=$('.cw-hero-floor',stage);
    ingredient=$('.cw-ingredient',stage);sourceBadge=$('.cw-source',stage);meta=$('.cw-meta',stage);
    titleSmall=$('.cw-name',stage);desc=$('.cw-desc',stage);counter=$('.cw-counter',stage);
    detailBtn=$('.cw-detail',stage);prevBtn=$('.cw-prev',stage);nextBtn=$('.cw-next',stage);hint=$('.cw-hint',stage);
    return true;
  }

  function setWorld(el,item){
    if(!el||!item)return;
    el.style.setProperty('--cw-bg',item.bg||'#0b0b09');
    el.style.setProperty('--cw-accent',item.accent||'#ff6a3c');
    el.dataset.item=item.id;
  }
  function setGiant(el,item){if(el&&item){el.textContent=item.word||item.name||'';el.dataset.item=item.id}}
  function setHero(el,item){if(el&&item){el.src=item.image||'';el.alt='';el.dataset.item=item.id}}
  function setDecor(item){
    if(!decorWrap)return;decorWrap.innerHTML='';
    (item?.decor||[]).slice(0,isMobile()?1:3).forEach((src,i)=>{
      const im=document.createElement('img');im.src=src;im.alt='';im.className='cw-decor-el';
      im.style.setProperty('--cw-d',String(i));decorWrap.appendChild(im);
    });
  }
  function setCopy(item,i){
    if(!item)return;
    sourceBadge.textContent=item.kind==='pizza'?'SELECCIÓN DE PIZZAS':'PLATOS DE AUTOR';
    meta.textContent=item.meta||'';titleSmall.textContent=item.name||'';
    desc.textContent=item.description||item.ingredients||'';
    counter.textContent=`${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
    detailBtn.hidden=item.kind!=='dish';
    root.style.setProperty('--cw-accent',item.accent||'#ff6a3c');
    stage?.style.setProperty('--cw-accent',item.accent||'#ff6a3c');
    stage?.style.setProperty('--cw-bg',item.bg||'#0b0b09');
  }
  function markActive(i){observers.forEach(fn=>{try{fn(state())}catch{}});
    if(items[i]?.kind==='dish')window.RestaurantOrbit?.setProgress?.(i);}

  async function renderImmediate(i){
    const item=items[i];if(!item||!stage)return;
    tween?.kill?.();tween=null;transitioning=false;dir=0;pending=null;
    const fw=frontWorld==='a'?worldA:worldB,ow=frontWorld==='a'?worldB:worldA;
    const ft=frontTitle==='a'?titleA:titleB,ot=frontTitle==='a'?titleB:titleA;
    const fh=frontHero==='a'?heroA:heroB,oh=frontHero==='a'?heroB:heroA;
    setWorld(fw,item);setGiant(ft,item);setHero(fh,item);setDecor(item);setCopy(item,i);
    fw.style.opacity='1';fw.style.transform='scale(1)';ow.style.opacity='0';
    ft.style.opacity='1';ft.style.transform='translate(-50%,-50%)';ft.style.filter='none';ot.style.opacity='0';
    fh.style.opacity='1';fh.style.transform='translate(-50%,-50%) scale(1)';fh.style.filter='none';oh.style.opacity='0';
    heroFloor.style.opacity='.7';heroFloor.style.transform='translate(-50%,-50%) scale(1)';
    ingredient.style.opacity='0';ingredient.style.transform='translate(-50%,-50%) scale(0.6)';
    ingredient.src=await wipeMediaFor(item)||item.image||'';
    decorWrap.style.opacity='1';
    active=i;progress=0;
    delete stage.dataset.transition;delete stage.dataset.direction;delete root.dataset.chromaticWipeTransition;
    markActive(i);syncStudio();
  }

  /* ---------- the transition director: one progress → every layer ---------- */
  function applyFrame(p){
    const from=items[fromIndex],to=items[toIndex];if(!from||!to)return;
    const c=cfg(),d=dir;
    /* WORLD — crossfade under the occluder, plus a live accent blend for the copy/arrows */
    const world=smooth(0.40,0.60,p);
    const fw=frontWorld==='a'?worldA:worldB,iw=frontWorld==='a'?worldB:worldA;
    fw.style.opacity=String(1-world);fw.style.transform=`scale(${(1-0.05*world).toFixed(3)})`;
    iw.style.opacity=String(world);iw.style.transform=`scale(${(1.06-0.06*world).toFixed(3)})`;
    const accent=mixColor(from.accent||'#ff6a3c',to.accent||from.accent,world);
    root.style.setProperty('--cw-accent',accent);stage.style.setProperty('--cw-accent',accent);
    /* GIANT TITLE — outgoing leaves in nav direction, incoming enters from the opposite side */
    const ft=frontTitle==='a'?titleA:titleB,it=frontTitle==='a'?titleB:titleA;
    const outT=smooth(0.10,0.48,p),inT=smooth(0.52,0.90,p);
    ft.style.opacity=String(1-outT);
    ft.style.transform=`translate(-50%,-50%) translateX(${(-d*outT*14).toFixed(2)}vw) scale(${(1-0.06*outT).toFixed(3)})`;
    ft.style.filter=outT>0?`blur(${(outT*6).toFixed(2)}px)`:'none';
    it.style.opacity=String(inT);
    it.style.transform=`translate(-50%,-50%) translateX(${(d*(1-inT)*16).toFixed(2)}vw) scale(${(0.94+0.06*inT).toFixed(3)})`;
    it.style.filter=inT<1?`blur(${((1-inT)*6).toFixed(2)}px)`:'none';
    /* HERO — outgoing retreats & blurs behind the ingredient; incoming rises from depth */
    const fh=frontHero==='a'?heroA:heroB,ih=frontHero==='a'?heroB:heroA;
    const outH=smooth(0.14,0.52,p),inH=smooth(0.50,0.94,p);
    fh.style.opacity=String(1-outH);
    fh.style.transform=`translate(-50%,-50%) translateX(${(-d*outH*10).toFixed(2)}%) scale(${lerp(1,c.heroDip,outH).toFixed(3)})`;
    fh.style.filter=outH>0?`blur(${(outH*c.blur).toFixed(2)}px)`:'none';
    const inLift=inH>=1?0:(1-inH)*4;
    ih.style.opacity=String(inH);
    ih.style.transform=`translate(-50%,-50%) translateX(${(d*(1-inH)*12).toFixed(2)}%) translateY(${inLift.toFixed(2)}%) scale(${lerp(c.heroDip,1,inH).toFixed(3)})`;
    ih.style.filter=inH<1?`blur(${((1-inH)*c.blur).toFixed(2)}px)`:'none';
    heroFloor.style.opacity=String(0.7*(1-Math.sin(Math.PI*clamp((p-0.1)/0.8,0,1))*0.5));
    /* SUPPORTING MEDIA — subtle exit/enter with a touch of parallax */
    decorWrap.style.opacity=String(1-Math.sin(Math.PI*clamp((p-0.1)/0.8,0,1)));
    decorWrap.style.transform=`translateX(${(-d*smooth(0.1,0.9,p)*3).toFixed(2)}vw)`;
    /* GIANT INGREDIENT — enters from the nav edge, dominates at midpoint, exits opposite */
    const enter=0.12,exit=0.90,t=clamp((p-enter)/(exit-enter),0,1);
    const x=d*(c.sweep-2*c.sweep*t);
    const env=Math.sin(Math.PI*t);
    const scale=0.6+(c.peak-0.6)*env;
    const rot=-d*c.rot*env;
    const vis=p>0.08&&p<0.95?1:0;
    ingredient.style.opacity=String(vis);
    ingredient.style.transform=`translate(-50%,-50%) translateX(${x.toFixed(2)}vw) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
  }

  function applyFrameReduced(p){
    const to=items[toIndex],from=items[fromIndex];if(!to||!from)return;
    const fw=frontWorld==='a'?worldA:worldB,iw=frontWorld==='a'?worldB:worldA;
    fw.style.opacity=String(1-p);iw.style.opacity=String(p);iw.style.transform='scale(1)';
    const ft=frontTitle==='a'?titleA:titleB,it=frontTitle==='a'?titleB:titleA;
    ft.style.opacity=String(1-p);it.style.opacity=String(p);it.style.transform='translate(-50%,-50%)';it.style.filter='none';
    const fh=frontHero==='a'?heroA:heroB,ih=frontHero==='a'?heroB:heroA;
    fh.style.opacity=String(1-p);ih.style.opacity=String(p);ih.style.transform='translate(-50%,-50%) scale(1)';ih.style.filter='none';
    root.style.setProperty('--cw-accent',mixColor(from.accent,to.accent,p));
    ingredient.style.opacity='0';
  }

  async function prepareIncoming(){
    const to=items[toIndex];if(!to)return;
    const iw=frontWorld==='a'?worldB:worldA;setWorld(iw,to);iw.style.opacity='0';iw.style.transform='scale(1.06)';
    const it=frontTitle==='a'?titleB:titleA;setGiant(it,to);it.style.opacity='0';
    const ih=frontHero==='a'?heroB:heroA;setHero(ih,to);ih.style.opacity='0';
    ingredient.src=await wipeMediaFor(items[dir>0?fromIndex:toIndex])||to.image||'';
    /* preload next hero so the reveal is never blank */
    if(to.image){const pre=new Image();pre.src=to.image;}
  }

  async function transitionTo(target,d){
    if(!items.length)return;
    const to=normalize(target,items.length);
    if(to===active){return}
    if(transitioning){pending={target:to,dir:d};if(tween)tween.timeScale(1.35);return}
    fromIndex=active<0?indexAtRest():active;toIndex=to;dir=d||1;
    transitioning=true;progress=0;
    stage.dataset.transition='1';stage.dataset.direction=dir>0?'next':'prev';
    root.dataset.chromaticWipeTransition='travel';
    setCopy(items[toIndex],toIndex);
    await prepareIncoming();

    const finish=()=>{
      progress=1;transitioning=false;
      frontWorld=frontWorld==='a'?'b':'a';frontTitle=frontTitle==='a'?'b':'a';frontHero=frontHero==='a'?'b':'a';
      active=toIndex;dir=0;tween=null;
      renderImmediate(toIndex);
      markActive(toIndex);
      if(pending){const p=pending;pending=null;transitionTo(p.target,p.dir)}
      else if(refreshQueued){refreshQueued=false;loadItems({reset:lastSource!==source()})}
    };

    const useReduced=reduced.matches;
    const draw=useReduced?applyFrameReduced:applyFrame;
    const dur=(useReduced?Math.min(320,durationMs()):durationMs())/1000;
    if(!window.gsap){ // deterministic fallback without gsap
      const t0=performance.now();
      const stepFn=now=>{const p=clamp((now-t0)/(dur*1000),0,1);progress=p;draw(p);
        if(p<1)requestAnimationFrame(stepFn);else finish()};
      requestAnimationFrame(stepFn);return;
    }
    const s={p:0};
    tween=gsap.to(s,{p:1,duration:dur,ease:useReduced?'power1.inOut':'power3.inOut',
      onUpdate(){progress=s.p;draw(s.p)},onComplete:finish});
  }

  /* ---------- navigation ---------- */
  function step(d){
    if(!isWipe()||!items.length)return;
    const base=transitioning?toIndex:active<0?indexAtRest():active;
    transitionTo(base+d,d);
  }
  function goTo(index){
    if(!isWipe()||!items.length)return;
    const n=items.length,base=transitioning?toIndex:(active<0?indexAtRest():active);
    let delta=normalize(index,n)-normalize(base,n);while(delta>n/2)delta-=n;while(delta<-n/2)delta+=n;
    if(delta)transitionTo(base+delta,delta>0?1:-1);
  }

  /* ---------- drag scrubs a constrained part of the transition ---------- */
  function beginScrub(d){
    if(transitioning)return;
    fromIndex=active<0?indexAtRest():active;toIndex=normalize(fromIndex+d,items.length);dir=d;scrubDir=d;
    stage.dataset.transition='1';stage.dataset.direction=d>0?'next':'prev';root.dataset.chromaticWipeTransition='scrub';
    setCopy(items[toIndex],toIndex);prepareIncoming();
  }
  function onDown(e){
    if(!isWipe()||!items.length||e.button>0)return;
    if(e.target.closest?.(INTERACTIVE)){e.stopPropagation();return}
    e.stopPropagation();
    if(tween){tween.kill();tween=null}
    dragging=true;pointerId=e.pointerId;axis='';scrubDir=0;
    startX=lastX=e.clientX;startY=e.clientY;lastT=e.timeStamp||performance.now();velocity=0;
    root.dataset.chromaticWipeDrag='1';
    try{stage.setPointerCapture(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(!axis){ if(Math.abs(dx)<6&&Math.abs(dy)<6)return; axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';
      if(axis==='y'){dragging=false;delete root.dataset.chromaticWipeDrag;try{stage.releasePointerCapture(e.pointerId)}catch{}return} }
    e.stopPropagation();
    const now=e.timeStamp||performance.now(),dt=Math.max(1,now-lastT);
    velocity=velocity*.6+((e.clientX-lastX)/dt)*.4;lastX=e.clientX;lastT=now;
    const d=dx<0?1:-1; // drag left → next
    if(!scrubDir||transitioning===false&&d!==scrubDir&&progress<0.02)beginScrub(d);
    if(d!==scrubDir&&progress<0.02){frontWorld;beginScrub(d)}
    const span=isMobile()?innerWidth*.52:innerWidth*.42;
    progress=clamp(Math.abs(dx)/span,0,0.5);
    (reduced.matches?applyFrameReduced:applyFrame)(progress);
  }
  function onUp(e){
    if(!dragging||(pointerId!==null&&e.pointerId!==pointerId))return;
    e.stopPropagation();dragging=false;pointerId=null;delete root.dataset.chromaticWipeDrag;
    try{stage.releasePointerCapture(e.pointerId)}catch{}
    if(!scrubDir||axis!=='x'){axis='';return}
    const commit=progress>0.24||Math.abs(velocity)>0.55;
    completeScrub(commit);
  }
  function completeScrub(commit){
    const d=scrubDir;scrubDir=0;axis='';
    const draw=reduced.matches?applyFrameReduced:applyFrame;
    const from=progress;
    const finish=()=>{
      if(commit){progress=1;
        frontWorld=frontWorld==='a'?'b':'a';frontTitle=frontTitle==='a'?'b':'a';frontHero=frontHero==='a'?'b':'a';
        active=toIndex;transitioning=false;dir=0;tween=null;renderImmediate(toIndex);markActive(toIndex);}
      else{transitioning=false;dir=0;tween=null;renderImmediate(active<0?indexAtRest():active);}
    };
    transitioning=commit; // committed run behaves like a transition until it settles
    if(!window.gsap){const target=commit?1:0,t0=performance.now(),d0=Math.abs(target-from)||0.001;
      const st=now=>{const k=clamp((now-t0)/(260*d0*4),0,1);progress=commit?lerp(from,1,k):lerp(from,0,k);draw(progress);
        if(k<1)requestAnimationFrame(st);else finish()};requestAnimationFrame(st);return}
    const s={p:from};
    tween=gsap.to(s,{p:commit?1:0,duration:commit?Math.max(.32,(1-from)*durationMs()/1000):.34,
      ease:'power3.out',onUpdate(){progress=s.p;draw(s.p)},onComplete:finish});
  }

  function onWheel(e){if(isWipe())e.stopPropagation()}
  function onKey(e){
    if(!isWipe())return;
    if(e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();step(1)}
    else if(e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();step(-1)}
  }
  const arrowPointer=(e,d)=>{e.preventDefault();e.stopPropagation();suppressArrowClickUntil=performance.now()+250;step(d)};
  const onPrevPointer=e=>arrowPointer(e,-1),onNextPointer=e=>arrowPointer(e,1);
  const onPrevClick=e=>{e.stopPropagation();if(performance.now()<suppressArrowClickUntil)return;step(-1)};
  const onNextClick=e=>{e.stopPropagation();if(performance.now()<suppressArrowClickUntil)return;step(1)};
  const onDetailClick=e=>{e.stopPropagation();window.RestaurantOrbit?.openDetail?.()};

  function bind(){
    if(mounted||!stage)return;mounted=true;
    stage.addEventListener('pointerdown',onDown);stage.addEventListener('pointermove',onMove);
    stage.addEventListener('pointerup',onUp);stage.addEventListener('pointercancel',onUp);
    stage.addEventListener('wheel',onWheel,{passive:true});stage.addEventListener('keydown',onKey);
    prevBtn.addEventListener('pointerup',onPrevPointer);nextBtn.addEventListener('pointerup',onNextPointer);
    prevBtn.addEventListener('click',onPrevClick);nextBtn.addEventListener('click',onNextClick);
    detailBtn.addEventListener('click',onDetailClick);addEventListener('resize',onResize);
  }
  function unbind(){
    if(!mounted)return;mounted=false;
    stage?.removeEventListener('pointerdown',onDown);stage?.removeEventListener('pointermove',onMove);
    stage?.removeEventListener('pointerup',onUp);stage?.removeEventListener('pointercancel',onUp);
    stage?.removeEventListener('wheel',onWheel);stage?.removeEventListener('keydown',onKey);
    prevBtn?.removeEventListener('pointerup',onPrevPointer);nextBtn?.removeEventListener('pointerup',onNextPointer);
    prevBtn?.removeEventListener('click',onPrevClick);nextBtn?.removeEventListener('click',onNextClick);
    detailBtn?.removeEventListener('click',onDetailClick);removeEventListener('resize',onResize);
  }
  function onResize(){if(!transitioning&&items[active])setDecor(items[active])}

  /* ---------- Studio (Motor de producto) ---------- */
  function ensureStudio(){
    const panel=$('.studio-panel.motion-panel');if(!panel||$('.cw-studio',panel))return;
    studioCard=document.createElement('article');studioCard.className='motion-card cw-studio';
    studioCard.innerHTML=`
      <div class="motion-card-head"><div><span class="motion-number">13</span><strong>Chromatic Ingredient Wipe</strong></div><span class="motion-badge">NUEVO</span></div>
      <p>Transición cinematográfica entre productos mediante un ingrediente a escala gigante y un cambio completo de mundo cromático.</p>
      <label>Productos
        <select class="cw-source-select"><option value="dishes">Platos del proyecto</option><option value="pizzas">Pizzas del proyecto</option></select></label>
      <label>Intensidad
        <select class="cw-intensity-select"><option value="suave">Suave</option><option value="cinematica">Cinemática</option><option value="intensa">Intensa</option></select></label>
      <label>Duración (ms)
        <input class="cw-duration" type="range" min="600" max="1300" step="50"></label>
      <div class="cw-studio-actions">
        <button type="button" class="cw-media-pick">Ingrediente…</button>
        <button type="button" class="cw-studio-activate">Activar</button>
        <button type="button" class="cw-studio-preview">Previsualizar ↓</button></div>
      <p class="studio-help cw-studio-state"></p>`;
    panel.appendChild(studioCard);
    const src=$('.cw-source-select',studioCard),int=$('.cw-intensity-select',studioCard),dur=$('.cw-duration',studioCard);
    src.addEventListener('change',()=>window.RestaurantStudioConfig?.set?.('motion.chromaticWipeSource',src.value));
    int.addEventListener('change',()=>window.RestaurantStudioConfig?.set?.('motion.chromaticWipeIntensity',int.value));
    dur.addEventListener('change',()=>window.RestaurantStudioConfig?.set?.('motion.chromaticWipeDuration',+dur.value));
    $('.cw-media-pick',studioCard).addEventListener('click',pickIngredient);
    $('.cw-studio-activate',studioCard).addEventListener('click',()=>activateFromStudio(false));
    $('.cw-studio-preview',studioCard).addEventListener('click',()=>activateFromStudio(true));
    syncStudio();
  }
  async function pickIngredient(){
    if(!window.RestaurantMediaPicker){alert('Media Library no disponible.');return}
    const chosen=await window.RestaurantMediaPicker.open({kind:'image',title:'Ingrediente de transición'});
    if(!chosen)return;
    const i=active<0?indexAtRest():active,item=items[i];if(!item)return;
    const path=item.kind==='pizza'?`pizzaSliceOrbit.products.${i}.transitionMediaRef`:`dishes.${i}.transitionMediaRef`;
    window.RestaurantStudioConfig?.set?.(path,chosen.ref);
    mediaUrlCache.delete(chosen.ref);
    if(isWipe())await loadItems({reset:false});
  }
  function syncStudio(){
    if(!studioCard)return;
    const src=$('.cw-source-select',studioCard);if(src&&document.activeElement!==src)src.value=source();
    const int=$('.cw-intensity-select',studioCard);if(int&&document.activeElement!==int)int.value=intensityKey();
    const dur=$('.cw-duration',studioCard);if(dur&&document.activeElement!==dur)dur.value=String(durationMs());
    const st=$('.cw-studio-state',studioCard);if(st)st.textContent=
      `${source()==='pizzas'?'Pizzas':'Platos'} · ${items.length||'—'} productos · ${intensityKey()} · ${durationMs()}ms · barrido de ingrediente`;
    const b=$('.cw-studio-activate',studioCard);if(b)b.textContent=isWipe()?'En uso':'Activar';
  }
  function activateFromStudio(preview){
    const sel=$('#motion-orbital-style');if(!sel)return;
    sel.value=MODE;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
    if(preview){window.RestaurantStudioShell?.close?.();setTimeout(()=>section?.scrollIntoView({behavior:'smooth',block:'start'}),140)}
  }

  async function activate(){
    injectOption();ensureStyles();ensureStage();ensureStudio();
    if(isWipe()){
      if(!mounted)shellTouchAction=shell.style.touchAction;
      shell.style.touchAction='pan-y';stage.hidden=false;bind();
      await loadItems({reset:lastSource!==source()});
      root.dataset.chromaticWipe='ready';root.dataset.orbitalChoreography='chromatic-ingredient-wipe';
      syncStudio();
    }else{
      tween?.kill?.();tween=null;transitioning=false;dir=0;pending=null;dragging=false;pointerId=null;
      delete root.dataset.chromaticWipeDrag;unbind();
      if(stage)stage.hidden=true;if(shell)shell.style.touchAction=shellTouchAction;
      delete root.dataset.chromaticWipe;delete root.dataset.chromaticWipeTransition;
      if(root.dataset.orbitalChoreography===MODE)delete root.dataset.orbitalChoreography;
      syncStudio();
    }
  }
  async function restoreSavedChoice(){
    if(review){
      const sel=$('#motion-orbital-style');if(!sel)return;
      sel.value=MODE;window.RestaurantMotionStudio?.publish?.();await activate();
      setTimeout(()=>section?.scrollIntoView({behavior:'auto',block:'start'}),80);return;
    }
    try{
      const saved=await window.RestaurantStore?.loadProject?.();
      const sel=$('#motion-orbital-style');
      if(saved?.config?.motion?.orbitalStyle!==MODE||!sel||sel.value===MODE)return;
      sel.value=MODE;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));
      window.RestaurantMotionStudio?.publish?.();
    }catch{}
  }

  new MutationObserver(()=>activate()).observe(root,{attributes:true,attributeFilter:['data-orbital-motion']});
  document.addEventListener('restaurant:config-applied',async()=>{
    ensureStudio();
    if(isWipe()){if(dragging||transitioning){refreshQueued=true;return}await loadItems({reset:lastSource!==source()})}
    else syncStudio();
  });

  function state(){return {ready:root.dataset.chromaticWipe==='ready',mode:root.dataset.orbitalMotion,
    source:source(),intensity:intensityKey(),duration:durationMs(),
    progress:+progress.toFixed(4),transition:transitioning,direction:transitioning?dir:0,
    activeIndex:indexAtRest(),count:items.length,dragging,mounted,pending:!!pending,
    activeId:items[indexAtRest()]?.id||null,activeName:items[indexAtRest()]?.name||null,
    accent:items[indexAtRest()]?.accent||null,review,reduced:reduced.matches}}

  function boot(){
    if(ready)return;
    if(!window.RestaurantOrbit||!window.RestaurantStudioConfig||!$('.orbit-shell')||!$('#motion-orbital-style'))return;
    if(!injectOption())return;
    ready=true;ensureStyles();ensureStage();ensureStudio();activate();restoreSavedChoice();
  }
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},120);
  setTimeout(()=>clearInterval(timer),20000);boot();

  window.RestaurantChromaticWipe={MODE,activate,step,goTo,
    setProgress(v){tween?.kill?.();tween=null;transitioning=false;progress=Number(v)||0;renderImmediate(indexAtRest())},
    subscribe(fn){if(typeof fn!=='function')return()=>{};observers.add(fn);return()=>observers.delete(fn)},
    state,items:()=>items.map(x=>({...x,raw:undefined}))};
})();
