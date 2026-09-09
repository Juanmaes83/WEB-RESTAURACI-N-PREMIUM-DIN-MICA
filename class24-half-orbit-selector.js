/* CLASS 24 · HALF ORBIT SELECTOR

   A deliberately different product choreography: one hero inside a visible half-orbit,
   product names riding the upper arc, and a 180deg sweep for every committed selection.

   ONE RUNTIME SCALAR:
     progress -> active index -> label geometry -> half-turn -> hero/copy/world

   DATA IS NOT DUPLICATED:
     dishes -> RestaurantOrbit.getDishes() (the live Project State collection)
     pizzas -> RestaurantStudioConfig.get('pizzaSliceOrbit').products + Project 07 manifest

   No store, no media library and no second Studio. The source choice is a normal
   `motion.halfOrbitSource` Project State field. `?review=half-orbit[&source=pizzas]`
   only overrides presentation in memory; it never writes project state.
*/
(() => {
  'use strict';
  const MODE='half-orbit';
  const MANIFEST_URL='assets/pizza-motion/slices-manifest.json';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const params=new URLSearchParams(location.search);
  const review=params.get('review')===MODE;
  const reviewSource=params.get('source')==='pizzas'?'pizzas':'dishes';
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const normalize=(v,n)=>n?((v%n)+n)%n:0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let section=null,shell=null,stage=null,arc=null,labels=null,hero=null,heroA=null,heroB=null;
  let worldA=null,worldB=null,copy=null,title=null,meta=null,desc=null,counter=null,detailBtn=null;
  let prevBtn=null,nextBtn=null,sourceBadge=null,studioCard=null;
  let items=[],pizzaManifest=null,progress=0,tween=null,ready=false,mounted=false;
  let active=-1,frontHero='a',frontWorld='a',lastSource='',lastSignature='';
  let dragging=false,pointerId=null,startX=0,startProgress=0,lastX=0,lastT=0,velocity=0,moved=false;
  let shellTouchAction='';
  const observers=new Set();

  const isHalf=()=>root.dataset.orbitalMotion===MODE;
  const isMobile=()=>innerWidth<760;
  const source=()=>review?reviewSource:
    (window.RestaurantStudioConfig?.get?.('motion.halfOrbitSource')==='pizzas'?'pizzas':'dishes');
  const activeIndex=()=>normalize(Math.round(progress),items.length);
  function continuousDistance(i){
    const n=items.length;if(!n)return 0;
    let d=i-progress;
    while(d>n/2)d-=n;
    while(d<-n/2)d+=n;
    return d;
  }

  function hexRgb(hex){
    const v=String(hex||'').replace('#','');
    const s=v.length===3?v.split('').map(c=>c+c).join(''):v;
    const n=parseInt(s,16);
    return Number.isFinite(n)?[n>>16&255,n>>8&255,n&255]:[216,255,79];
  }
  const rgba=(hex,a)=>`rgba(${hexRgb(hex).join(',')},${a})`;

  async function loadManifest(){
    if(pizzaManifest)return pizzaManifest;
    try{
      const r=await fetch(MANIFEST_URL,{cache:'force-cache'});
      if(!r.ok)throw new Error(`manifest ${r.status}`);
      pizzaManifest=await r.json();
    }catch(e){
      console.error('[half-orbit] pizza manifest unavailable',e);
      pizzaManifest={slices:[]};
    }
    return pizzaManifest;
  }

  function liveDishImage(d){
    const el=$(`#orbit-stage .orbit-dish[data-id="${CSS.escape(String(d.id||''))}"] img`);
    return el?.currentSrc||el?.src||d?.depthCarousel?.asset||d?.image||'';
  }
  function dishItems(){
    const list=window.RestaurantOrbit?.getDishes?.()||window.RestaurantStudioConfig?.snapshot?.().dishes||[];
    return list.filter(d=>d&&d.enabled!==false).map((d,i)=>({
      id:d.id||`dish-${i}`,name:d.name||`Plato ${i+1}`,
      meta:d.meta||'',description:d.short||'',ingredients:d.ingredients||'',price:d.price||'',
      image:liveDishImage(d),accent:d.depthCarousel?.accent||d.orbitalFood?.accent||
        window.RestaurantStudioConfig?.get?.('brand.accent')||'#d8ff4f',
      bgA:d.depthCarousel?.backgroundColor||'#11110e',bgB:'#050504',kind:'dish',raw:d
    }));
  }
  function pizzaItems(){
    const cfg=window.RestaurantStudioConfig?.get?.('pizzaSliceOrbit')||window.RestaurantDefaults?.pizzaSliceOrbit||{};
    const slices=pizzaManifest?.slices||[];
    const byId=new Map(slices.map(s=>[s.id,s]));
    return (cfg.products||[]).filter(p=>p&&p.available!==false).map((p,i)=>{
      const s=byId.get(p.id)||slices[i]||{};
      const bg=p.background||{};
      return {id:p.id||s.id||`pizza-${i}`,name:p.name||s.name||`Pizza ${i+1}`,
        meta:p.descriptor||p.mood||'',description:p.headlineTail||'',ingredients:p.ingredients||'',
        price:p.price??'',image:s.runtimeAsset||'',accent:p.accent||cfg.brand?.accent||'#d8ff4f',
        bgA:bg.a||'#17110a',bgB:bg.b||'#050505',kind:'pizza',raw:p};
    });
  }
  function signature(list,src){return `${src}|${list.map(x=>`${x.id}:${x.name}:${x.image}:${x.accent}`).join('|')}`}

  async function loadItems({reset=false}={}){
    const src=source();
    if(src==='pizzas')await loadManifest();
    const next=src==='pizzas'?pizzaItems():dishItems();
    const sig=signature(next,src);
    if(!reset&&sig===lastSignature)return false;
    lastSignature=sig;lastSource=src;items=next;
    if(reset||!items.length)progress=0;
    else progress=normalize(Math.round(progress),items.length);
    buildLabels();
    active=-1;
    paint(true);
    syncStudio();
    return true;
  }

  function ensureStyles(){
    if($('link[data-half-orbit-styles]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='styles-v24.css';
    l.dataset.halfOrbitStyles='1';document.head.appendChild(l);
  }
  function injectOption(){
    const s=$('#motion-orbital-style');if(!s)return false;
    if(!s.querySelector(`option[value="${MODE}"]`)){
      const o=document.createElement('option');o.value=MODE;o.textContent='Half Orbit Selector';s.appendChild(o);
    }
    return true;
  }

  function ensureStage(){
    section=section||$('.orbital-section');shell=shell||$('.orbit-shell');
    if(!section||!shell)return false;
    if(stage?.isConnected)return true;
    stage=document.createElement('div');stage.className='hos-stage';stage.tabIndex=0;
    stage.setAttribute('aria-label','Half Orbit Selector. Arrastra horizontalmente o usa las flechas.');
    stage.innerHTML=`
      <div class="hos-world hos-world-a" aria-hidden="true"><img alt=""></div>
      <div class="hos-world hos-world-b" aria-hidden="true"><img alt=""></div>
      <div class="hos-vignette" aria-hidden="true"></div>
      <div class="hos-orbit" aria-hidden="true"><div class="hos-orbit-sweep"></div><i></i><i></i><i></i></div>
      <div class="hos-labels" aria-label="Productos"></div>
      <div class="hos-hero" aria-hidden="true"><div class="hos-hero-floor"></div>
        <img class="hos-hero-img hos-hero-a" alt=""><img class="hos-hero-img hos-hero-b" alt=""></div>
      <div class="hos-copy">
        <p class="hos-source"></p><p class="hos-meta"></p>
        <h3 class="hos-title"></h3><p class="hos-desc"></p>
        <div class="hos-copy-foot"><span class="hos-counter"></span>
          <button type="button" class="hos-detail">Ver plato +</button></div>
      </div>
      <button type="button" class="hos-arrow hos-prev" aria-label="Anterior">←</button>
      <button type="button" class="hos-arrow hos-next" aria-label="Siguiente">→</button>
      <p class="hos-hint">ARRASTRA · FLECHAS</p>`;
    shell.appendChild(stage);
    arc=$('.hos-orbit',stage);labels=$('.hos-labels',stage);hero=$('.hos-hero',stage);
    heroA=$('.hos-hero-a',stage);heroB=$('.hos-hero-b',stage);
    worldA=$('.hos-world-a',stage);worldB=$('.hos-world-b',stage);
    copy=$('.hos-copy',stage);title=$('.hos-title',stage);meta=$('.hos-meta',stage);desc=$('.hos-desc',stage);
    counter=$('.hos-counter',stage);detailBtn=$('.hos-detail',stage);sourceBadge=$('.hos-source',stage);
    prevBtn=$('.hos-prev',stage);nextBtn=$('.hos-next',stage);
    return true;
  }

  function buildLabels(){
    if(!labels)return;
    labels.innerHTML='';
    items.forEach((item,i)=>{
      const b=document.createElement('button');b.type='button';b.className='hos-label';b.dataset.index=String(i);
      b.innerHTML=`<span>${esc(item.name)}</span>`;b.setAttribute('aria-label',`Seleccionar ${item.name}`);
      b.addEventListener('click',e=>{e.stopPropagation();goTo(i)});
      labels.appendChild(b);
    });
  }

  function placeLabels(){
    if(!labels||!items.length)return;
    const mob=isMobile(),rx=mob?43:45,ry=mob?19:25;
    $$('.hos-label',labels).forEach((el,i)=>{
      const d=continuousDistance(i);
      const abs=Math.abs(d);
      const visible=abs<=2.35;
      const theta=clamp(d,-2.25,2.25)*(Math.PI/4.5);
      const x=Math.sin(theta)*rx;
      const y=-Math.cos(theta)*ry;
      const focus=clamp(1-abs/2.45,0,1);
      el.style.setProperty('--hos-lx',`${x.toFixed(3)}vw`);
      el.style.setProperty('--hos-ly',`${y.toFixed(3)}vh`);
      el.style.setProperty('--hos-lscale',(0.72+focus*.28).toFixed(3));
      el.style.setProperty('--hos-lopacity',visible?(0.16+focus*.84).toFixed(3):'0');
      el.style.setProperty('--hos-lift',`${(-focus*12).toFixed(1)}px`);
      el.style.zIndex=String(Math.round(10+focus*30));
      el.dataset.active=abs<.5?'1':'0';
      el.tabIndex=abs<.5?0:-1;
      el.disabled=!visible;
    });
    /* The product labels glide by item distance; the graphic underneath performs the
       explicit half-turn: exactly 180 degrees for one unit of progress. */
    arc?.style.setProperty('--hos-turn',`${(progress*180).toFixed(2)}deg`);
  }

  function setWorld(el,item){
    if(!el||!item)return;
    el.style.setProperty('--hos-bg-a',item.bgA||'#11110e');
    el.style.setProperty('--hos-bg-b',item.bgB||'#050504');
    el.style.setProperty('--hos-accent',item.accent||'#d8ff4f');
    const img=$('img',el);if(img){img.src=item.image||'';img.style.display=item.image?'block':'none'}
    el.dataset.item=item.id;
  }
  function swapWorld(item,immediate=false){
    const incoming=frontWorld==='a'?worldB:worldA,outgoing=frontWorld==='a'?worldA:worldB;
    setWorld(incoming,item);
    if(!window.gsap||immediate||reduced.matches){
      incoming.style.opacity='1';outgoing.style.opacity='0';frontWorld=frontWorld==='a'?'b':'a';return;
    }
    gsap.killTweensOf([incoming,outgoing]);
    gsap.set(incoming,{opacity:0,scale:1.035});
    gsap.to(outgoing,{opacity:0,duration:.48,ease:'power2.out'});
    gsap.to(incoming,{opacity:1,scale:1,duration:.72,ease:'power3.out'});
    frontWorld=frontWorld==='a'?'b':'a';
  }
  function swapHero(item,immediate=false){
    const incoming=frontHero==='a'?heroB:heroA,outgoing=frontHero==='a'?heroA:heroB;
    incoming.src=item.image||'';incoming.alt='';incoming.dataset.item=item.id;
    if(!window.gsap||immediate||reduced.matches){
      incoming.style.opacity='1';incoming.style.transform='translate(-50%,-50%)';
      outgoing.style.opacity='0';frontHero=frontHero==='a'?'b':'a';return;
    }
    gsap.killTweensOf([incoming,outgoing]);
    gsap.set(incoming,{opacity:0,xPercent:-50,yPercent:-50,y:34,scale:.86,rotation:-4});
    gsap.to(outgoing,{opacity:0,y:-28,scale:.90,rotation:3,duration:.34,ease:'power2.in'});
    gsap.to(incoming,{opacity:1,y:0,scale:1,rotation:0,duration:.72,ease:'power4.out',delay:.08});
    frontHero=frontHero==='a'?'b':'a';
  }
  function paintCopy(item,i,immediate=false){
    if(!item)return;
    sourceBadge.textContent=item.kind==='pizza'?'PIZZA COLLECTION':'SIGNATURE DISHES';
    meta.textContent=item.meta||'';title.textContent=item.name||'';
    desc.textContent=item.description||item.ingredients||'';
    counter.textContent=`${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
    detailBtn.hidden=item.kind!=='dish';
    root.style.setProperty('--hos-accent',item.accent||'#d8ff4f');
    if(window.gsap&&!immediate&&!reduced.matches){
      gsap.killTweensOf([sourceBadge,meta,title,desc,counter]);
      gsap.fromTo(title,{y:46,opacity:0,scale:.94},{y:0,opacity:1,scale:1,duration:.62,ease:'power4.out'});
      gsap.fromTo([sourceBadge,meta,desc,counter],{y:16,opacity:0},{y:0,opacity:1,duration:.48,ease:'power3.out',stagger:.045,delay:.08});
    }
  }
  function commitActive(immediate=false){
    const i=activeIndex(),item=items[i];if(!item)return;
    if(i===active&&!immediate)return;
    active=i;
    swapWorld(item,immediate);swapHero(item,immediate);paintCopy(item,i,immediate);
    if(item.kind==='dish')window.RestaurantOrbit?.setProgress?.(i);
    $$('.hos-label',labels).forEach((el,k)=>el.setAttribute('aria-current',String(k===i)));
    observers.forEach(fn=>{try{fn(state())}catch{}});
  }
  function paint(immediate=false){placeLabels();commitActive(immediate)}

  function animateTo(target,duration=.64){
    tween?.kill?.();
    const dur=reduced.matches?Math.min(.16,duration):duration;
    if(!window.gsap){progress=Math.round(target);paint();return}
    const s={p:progress};
    tween=gsap.to(s,{p:target,duration:dur,ease:reduced.matches?'power2.out':'power4.inOut',
      onUpdate(){progress=s.p;placeLabels()},
      onComplete(){progress=Math.round(target);paint();tween=null}});
  }
  function step(dir){if(!isHalf()||!items.length)return;animateTo(Math.round(progress)+dir)}
  function goTo(index){
    if(!isHalf()||!items.length)return;
    const n=items.length,target=normalize(index,n),now=normalize(Math.round(progress),n);
    let d=target-now;while(d>n/2)d-=n;while(d<-n/2)d+=n;
    if(d)animateTo(Math.round(progress)+d,.72);
  }
  function settle(){
    const projected=progress-velocity*(isMobile()?.22:.28);
    animateTo(Math.round(projected),.56);
  }

  function onDown(e){
    if(!isHalf()||!items.length||e.button>0)return;
    e.stopPropagation();dragging=true;moved=false;pointerId=e.pointerId;
    startX=lastX=e.clientX;startProgress=progress;lastT=e.timeStamp||performance.now();velocity=0;
    tween?.kill?.();tween=null;root.dataset.halfOrbitDrag='1';
    try{stage.setPointerCapture(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    e.stopPropagation();const now=e.timeStamp||performance.now(),dt=Math.max(1,now-lastT);
    velocity=velocity*.62+((e.clientX-lastX)/dt)*.38;lastX=e.clientX;lastT=now;
    const dx=e.clientX-startX;if(Math.abs(dx)>4)moved=true;
    progress=startProgress-dx/(isMobile()?155:230);placeLabels();
  }
  function onUp(e){
    if(!dragging||(pointerId!==null&&e.pointerId!==pointerId))return;
    e.stopPropagation();dragging=false;pointerId=null;delete root.dataset.halfOrbitDrag;
    try{stage.releasePointerCapture(e.pointerId)}catch{}
    if(!moved){animateTo(Math.round(startProgress),.24);return}
    const travel=Math.abs(progress-startProgress),fling=Math.abs(velocity)>.45;
    (travel>.22||fling)?settle():animateTo(Math.round(startProgress),.40);
  }
  function onWheel(e){if(isHalf())e.stopPropagation()}
  function onKey(e){
    if(!isHalf())return;
    if(e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();step(1)}
    else if(e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();step(-1)}
  }

  function bind(){
    if(mounted||!stage)return;mounted=true;
    stage.addEventListener('pointerdown',onDown);
    stage.addEventListener('pointermove',onMove);
    stage.addEventListener('pointerup',onUp);
    stage.addEventListener('pointercancel',onUp);
    stage.addEventListener('wheel',onWheel,{passive:true});
    stage.addEventListener('keydown',onKey);
    prevBtn.addEventListener('click',e=>{e.stopPropagation();step(-1)});
    nextBtn.addEventListener('click',e=>{e.stopPropagation();step(1)});
    detailBtn.addEventListener('click',e=>{e.stopPropagation();window.RestaurantOrbit?.openDetail?.()});
    addEventListener('resize',placeLabels);
  }
  function unbind(){
    if(!mounted)return;mounted=false;
    stage?.removeEventListener('pointerdown',onDown);stage?.removeEventListener('pointermove',onMove);
    stage?.removeEventListener('pointerup',onUp);stage?.removeEventListener('pointercancel',onUp);
    stage?.removeEventListener('wheel',onWheel);stage?.removeEventListener('keydown',onKey);
    removeEventListener('resize',placeLabels);
  }

  function ensureStudio(){
    const panel=$('.studio-panel.motion-panel');if(!panel||$('.hos-studio',panel))return;
    studioCard=document.createElement('article');studioCard.className='motion-card hos-studio';
    studioCard.innerHTML=`
      <div class="motion-card-head"><div><span class="motion-number">12</span><strong>Half Orbit Selector</strong></div><span class="motion-badge">NEW</span></div>
      <p>Media circunferencia tipográfica. El producto activo ocupa el centro; cada cambio hace un barrido de 180° y eleva el titular.</p>
      <label>Productos
        <select class="hos-source-select"><option value="dishes">Platos del proyecto</option><option value="pizzas">Pizzas del proyecto</option></select>
      </label>
      <div class="hos-studio-actions"><button type="button" class="hos-studio-activate">Activar</button><button type="button" class="hos-studio-preview">Previsualizar ↓</button></div>
      <p class="studio-help hos-studio-state"></p>`;
    panel.appendChild(studioCard);
    const sel=$('.hos-source-select',studioCard);
    sel.addEventListener('change',()=>window.RestaurantStudioConfig?.set?.('motion.halfOrbitSource',sel.value));
    $('.hos-studio-activate',studioCard).addEventListener('click',()=>activateFromStudio(false));
    $('.hos-studio-preview',studioCard).addEventListener('click',()=>activateFromStudio(true));
    syncStudio();
  }
  function syncStudio(){
    if(!studioCard)return;
    const sel=$('.hos-source-select',studioCard);if(sel&&document.activeElement!==sel)sel.value=source();
    const st=$('.hos-studio-state',studioCard);if(st)st.textContent=
      `${source()==='pizzas'?'Pizzas':'Platos'} · ${items.length||'—'} productos · drag + flechas · sin secuestrar el scroll`;
    const b=$('.hos-studio-activate',studioCard);if(b)b.textContent=isHalf()?'En uso':'Activar';
  }
  function activateFromStudio(preview){
    const sel=$('#motion-orbital-style');if(!sel)return;
    sel.value=MODE;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
    if(preview){window.RestaurantStudioShell?.close?.();setTimeout(()=>section?.scrollIntoView({behavior:'smooth',block:'start'}),140)}
  }

  async function activate(){
    injectOption();ensureStyles();ensureStage();ensureStudio();
    if(isHalf()){
      shellTouchAction=shell.style.touchAction;shell.style.touchAction='pan-y';stage.hidden=false;bind();
      await loadItems({reset:lastSource!==source()});
      root.dataset.halfOrbit='ready';root.dataset.orbitalChoreography='half-orbit-v1';
      syncStudio();
    }else{
      tween?.kill?.();tween=null;dragging=false;pointerId=null;delete root.dataset.halfOrbitDrag;
      if(stage)stage.hidden=true;if(shell)shell.style.touchAction=shellTouchAction;
      delete root.dataset.halfOrbit;syncStudio();
    }
  }

  async function restoreSavedChoice(){
    if(review){
      const sel=$('#motion-orbital-style');if(!sel)return;
      sel.value=MODE;window.RestaurantMotionStudio?.publish?.();
      await activate();
      setTimeout(()=>section?.scrollIntoView({behavior:'auto',block:'start'}),80);
      return;
    }
    try{
      const saved=await window.RestaurantStore?.loadProject?.();
      const sel=$('#motion-orbital-style');
      if(saved?.config?.motion?.orbitalStyle!==MODE||!sel||sel.value===MODE)return;
      sel.value=MODE;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));
      window.RestaurantMotionStudio?.publish?.();
    }catch{}
  }

  root.addEventListener?.('half-orbit-noop',()=>{});
  new MutationObserver(()=>activate()).observe(root,{attributes:true,attributeFilter:['data-orbital-motion']});
  document.addEventListener('restaurant:config-applied',async()=>{
    ensureStudio();
    if(isHalf())await loadItems({reset:lastSource!==source()});
    else syncStudio();
  });

  function state(){return {ready:root.dataset.halfOrbit==='ready',mode:root.dataset.orbitalMotion,
    source:source(),progress,activeIndex:activeIndex(),count:items.length,dragging,
    activeId:items[activeIndex()]?.id||null,activeName:items[activeIndex()]?.name||null,
    halfTurnDeg:+(progress*180).toFixed(2),review,reduced:reduced.matches}}

  function boot(){
    if(ready)return;
    if(!window.gsap||!window.RestaurantOrbit||!window.RestaurantStudioConfig||!$('.orbit-shell'))return;
    if(!injectOption())return;
    ready=true;ensureStyles();ensureStage();ensureStudio();activate();restoreSavedChoice();
  }
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},120);
  setTimeout(()=>clearInterval(timer),20000);boot();

  window.RestaurantHalfOrbit={MODE,activate,step,goTo,
    setProgress(v){tween?.kill?.();progress=Number(v)||0;paint()},
    subscribe(fn){if(typeof fn!=='function')return()=>{};observers.add(fn);return()=>observers.delete(fn)},
    state,items:()=>items.map(x=>({...x,raw:undefined}))};
})();