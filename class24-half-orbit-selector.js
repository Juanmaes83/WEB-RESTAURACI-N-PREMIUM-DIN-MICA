/* CLASS 24 · HALF ORBIT SELECTOR

   A deliberately different product choreography: one hero inside a visible half-orbit,
   product names riding the upper arc, and a 180deg sweep for every committed selection.

   ONE RUNTIME SCALAR:
     progress -> active index -> label geometry -> half-turn -> hero/copy/world

   ONE TRANSITION DIRECTOR:
     anticipate -> travel -> settle coordinates orbit + hero + chroma + copy + labels.

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
  const INTERACTIVE='button,a,input,select,textarea,label,[role="button"]';
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

  let section=null,shell=null,stage=null,arc=null,labels=null,hero=null,heroA=null,heroB=null,heroFloor=null;
  let worldA=null,worldB=null,chroma=null,copy=null,title=null,titleGhost=null,titleFlare=null;
  let meta=null,desc=null,counter=null,detailBtn=null,prevBtn=null,nextBtn=null,sourceBadge=null,studioCard=null;
  let items=[],pizzaManifest=null,progress=0,tween=null,goal=null,ready=false,mounted=false;
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

  function signature(list,src){
    return `${src}|${list.map(x=>[
      x.id,x.name,x.meta,x.description,x.ingredients,x.price,x.image,x.accent,x.bgA,x.bgB,x.kind
    ].map(v=>String(v??'')).join('~')).join('|')}`;
  }

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
    renderImmediate(activeIndex());
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
    stage.setAttribute('aria-label','Selector semicircular. Arrastra horizontalmente o usa las flechas.');
    stage.innerHTML=`
      <div class="hos-world hos-world-a" aria-hidden="true"><img alt=""></div>
      <div class="hos-world hos-world-b" aria-hidden="true"><img alt=""></div>
      <div class="hos-chroma" aria-hidden="true"></div>
      <div class="hos-vignette" aria-hidden="true"></div>
      <div class="hos-orbit" aria-hidden="true"><div class="hos-orbit-sweep"></div><i></i><i></i><i></i></div>
      <div class="hos-labels" aria-label="Productos"></div>
      <div class="hos-hero" aria-hidden="true"><div class="hos-hero-floor"></div>
        <img class="hos-hero-img hos-hero-a" alt=""><img class="hos-hero-img hos-hero-b" alt=""></div>
      <div class="hos-copy">
        <p class="hos-source"></p><p class="hos-meta"></p>
        <div class="hos-title-wrap">
          <h3 class="hos-title"></h3><h3 class="hos-title-ghost" aria-hidden="true"></h3>
          <span class="hos-title-flare" aria-hidden="true"></span>
        </div>
        <p class="hos-desc"></p>
        <div class="hos-copy-foot"><span class="hos-counter"></span>
          <button type="button" class="hos-detail">Ver plato +</button></div>
      </div>
      <button type="button" class="hos-arrow hos-prev" aria-label="Anterior">←</button>
      <button type="button" class="hos-arrow hos-next" aria-label="Siguiente">→</button>
      <p class="hos-hint">ARRASTRA · FLECHAS</p>`;
    shell.appendChild(stage);
    arc=$('.hos-orbit',stage);labels=$('.hos-labels',stage);hero=$('.hos-hero',stage);
    heroA=$('.hos-hero-a',stage);heroB=$('.hos-hero-b',stage);heroFloor=$('.hos-hero-floor',stage);
    worldA=$('.hos-world-a',stage);worldB=$('.hos-world-b',stage);chroma=$('.hos-chroma',stage);
    copy=$('.hos-copy',stage);title=$('.hos-title',stage);titleGhost=$('.hos-title-ghost',stage);
    titleFlare=$('.hos-title-flare',stage);meta=$('.hos-meta',stage);desc=$('.hos-desc',stage);
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
      const blur=(1-focus)*1.7;
      el.style.setProperty('--hos-lx',`${x.toFixed(3)}vw`);
      el.style.setProperty('--hos-ly',`${y.toFixed(3)}vh`);
      el.style.setProperty('--hos-lscale',(0.70+focus*.31).toFixed(3));
      el.style.setProperty('--hos-lopacity',visible?(0.12+focus*.88).toFixed(3):'0');
      el.style.setProperty('--hos-lift',`${(-focus*14).toFixed(1)}px`);
      el.style.setProperty('--hos-lblur',`${blur.toFixed(2)}px`);
      el.style.zIndex=String(Math.round(10+focus*30));
      el.dataset.active=abs<.5?'1':'0';
      el.tabIndex=abs<.5?0:-1;
      el.disabled=!visible;
    });
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

  function setHero(el,item){
    if(!el||!item)return;
    el.src=item.image||'';el.alt='';el.dataset.item=item.id;
  }

  function setCopyContent(item,i){
    if(!item)return;
    sourceBadge.textContent=item.kind==='pizza'?'SELECCIÓN DE PIZZAS':'PLATOS DE AUTOR';
    meta.textContent=item.meta||'';title.textContent=item.name||'';
    desc.textContent=item.description||item.ingredients||'';
    counter.textContent=`${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
    detailBtn.hidden=item.kind!=='dish';
    root.style.setProperty('--hos-accent',item.accent||'#d8ff4f');
    stage?.style.setProperty('--hos-accent',item.accent||'#d8ff4f');
    chroma?.style.setProperty('--hos-chroma',item.accent||'#d8ff4f');
    titleFlare?.style.setProperty('--hos-chroma',item.accent||'#d8ff4f');
  }

  function markActive(i){
    $$('.hos-label',labels).forEach((el,k)=>el.setAttribute('aria-current',String(k===i)));
  }

  function notifyActive(i,item){
    if(item?.kind==='dish')window.RestaurantOrbit?.setProgress?.(i);
    markActive(i);
    observers.forEach(fn=>{try{fn(state())}catch{}});
  }

  function renderImmediate(i=activeIndex()){
    const item=items[i];if(!item||!stage)return;
    tween?.kill?.();tween=null;goal=null;
    const fw=frontWorld==='a'?worldA:worldB,ow=frontWorld==='a'?worldB:worldA;
    const fh=frontHero==='a'?heroA:heroB,oh=frontHero==='a'?heroB:heroA;
    setWorld(fw,item);setHero(fh,item);setCopyContent(item,i);
    if(window.gsap){
      gsap.killTweensOf([fw,ow,fh,oh,chroma,title,titleGhost,titleFlare,heroFloor,sourceBadge,meta,desc,counter]);
      gsap.set(fw,{opacity:1,scale:1,filter:'blur(0px)'});gsap.set(ow,{opacity:0,scale:1});
      gsap.set(fh,{opacity:1,xPercent:-50,yPercent:-50,x:0,y:0,scale:1,rotation:0,filter:'blur(0px)'});
      gsap.set(oh,{opacity:0,xPercent:-50,yPercent:-50,x:0,y:0,scale:1,rotation:0});
      gsap.set([title,sourceBadge,meta,desc,counter],{opacity:1,x:0,y:0,scale:1,filter:'blur(0px)',clearProps:'color'});
      gsap.set(titleGhost,{opacity:0,x:0,y:0,scale:1,filter:'blur(0px)'});
      gsap.set(titleFlare,{opacity:0,scaleX:0,xPercent:0});gsap.set(chroma,{opacity:0,scale:.35,rotation:0});
      gsap.set(heroFloor,{opacity:.72,scale:1});
    }else{
      fw.style.opacity='1';ow.style.opacity='0';fh.style.opacity='1';oh.style.opacity='0';
      fh.style.transform='translate(-50%,-50%)';title.style.opacity='1';
    }
    titleGhost.textContent='';active=i;placeLabels();markActive(i);
    delete stage.dataset.transition;delete stage.dataset.direction;delete root.dataset.halfOrbitTransition;
  }

  function animateProgressOnly(target,duration=.46){
    tween?.kill?.();goal=target;
    const dur=reduced.matches?Math.min(.14,duration):duration;
    if(!window.gsap){progress=Math.round(target);placeLabels();goal=null;return}
    const s={p:progress};
    tween=gsap.to(s,{p:target,duration:dur,ease:reduced.matches?'power2.out':'power3.out',
      onUpdate(){progress=s.p;placeLabels()},
      onComplete(){progress=Math.round(target);placeLabels();tween=null;goal=null}});
  }

  function transitionTo(target,duration=.82){
    if(!items.length)return;
    const targetRound=Math.round(target),i=normalize(targetRound,items.length),item=items[i];
    if(!item)return;
    const delta=targetRound-progress,dir=delta===0?1:Math.sign(delta);
    if(i===active){animateProgressOnly(targetRound,Math.min(.46,duration));return}
    tween?.kill?.();goal=targetRound;

    if(!window.gsap||reduced.matches){
      progress=targetRound;active=i;renderImmediate(i);notifyActive(i,item);return;
    }

    const incomingWorld=frontWorld==='a'?worldB:worldA;
    const outgoingWorld=frontWorld==='a'?worldA:worldB;
    const incomingHero=frontHero==='a'?heroB:heroA;
    const outgoingHero=frontHero==='a'?heroA:heroB;
    const previousTitle=title.textContent||items[active]?.name||'';
    setWorld(incomingWorld,item);setHero(incomingHero,item);
    titleGhost.textContent=previousTitle;
    setCopyContent(item,i);
    active=i;frontWorld=frontWorld==='a'?'b':'a';frontHero=frontHero==='a'?'b':'a';
    stage.dataset.transition='1';stage.dataset.direction=dir>0?'next':'prev';
    root.dataset.halfOrbitTransition='travel';

    const dur=Math.max(.58,duration),overshoot=targetRound+dir*.04;
    const p={v:progress};
    const tl=gsap.timeline({
      defaults:{overwrite:'auto'},
      onComplete(){
        progress=targetRound;placeLabels();
        gsap.set(outgoingWorld,{opacity:0});gsap.set(outgoingHero,{opacity:0});
        gsap.set(incomingWorld,{opacity:1,scale:1,filter:'blur(0px)'});
        gsap.set(incomingHero,{opacity:1,xPercent:-50,yPercent:-50,x:0,y:0,scale:1,rotation:0,filter:'blur(0px)'});
        gsap.set(title,{opacity:1,x:0,y:0,scale:1,filter:'blur(0px)',clearProps:'color'});
        gsap.set(titleGhost,{opacity:0});gsap.set([chroma,titleFlare],{opacity:0});
        titleGhost.textContent='';delete stage.dataset.transition;delete stage.dataset.direction;
        delete root.dataset.halfOrbitTransition;goal=null;tween=null;notifyActive(i,item);syncStudio();
      }
    });
    tween=tl;

    /* ANTICIPATE — the current world and dish retreat before the collection travels. */
    tl.set(incomingWorld,{opacity:0,scale:1.09,filter:'blur(10px)'},0)
      .set(incomingHero,{opacity:0,xPercent:-50,yPercent:-50,x:dir*92,y:46,scale:.74,rotation:-dir*11,filter:'blur(12px)'},0)
      .set(chroma,{opacity:0,scale:.28,rotation:-dir*8},0)
      .set(titleGhost,{opacity:1,x:0,y:0,scale:1,filter:'blur(0px)'},0)
      .set(title,{opacity:0,x:dir*14,y:58,scale:.91,filter:'blur(10px)',color:item.accent||'#d8ff4f'},0)
      .set(titleFlare,{opacity:0,scaleX:0,xPercent:0,transformOrigin:dir>0?'0% 50%':'100% 50%'},0)
      .to(outgoingHero,{opacity:.34,x:-dir*28,y:24,scale:.88,rotation:dir*7,filter:'blur(5px)',duration:dur*.30,ease:'power3.in'},0)
      .to(outgoingWorld,{opacity:.34,scale:.97,filter:'blur(4px)',duration:dur*.34,ease:'power2.in'},0)
      .to(titleGhost,{opacity:0,x:-dir*18,y:-34,scale:.96,filter:'blur(5px)',duration:dur*.26,ease:'power2.in'},0)
      .to([sourceBadge,meta,desc,counter],{opacity:0,y:-12,duration:dur*.20,ease:'power2.in'},0);

    /* TRAVEL — one timeline drives the 180deg arc, chromatic world, hero and copy. */
    tl.to(p,{v:overshoot,duration:dur*.82,ease:'power4.inOut',onUpdate(){progress=p.v;placeLabels()}},0)
      .to(chroma,{opacity:.92,scale:1.18,rotation:dir*5,duration:dur*.44,ease:'expo.out'},dur*.10)
      .to(chroma,{opacity:0,scale:1.62,duration:dur*.42,ease:'power2.out'},dur*.42)
      .to(incomingWorld,{opacity:1,scale:1,filter:'blur(0px)',duration:dur*.66,ease:'power3.out'},dur*.10)
      .to(outgoingWorld,{opacity:0,duration:dur*.32,ease:'power2.out'},dur*.28)
      .to(incomingHero,{opacity:1,x:0,y:-12,scale:1.055,rotation:0,filter:'blur(0px)',duration:dur*.52,ease:'power4.out'},dur*.20)
      .to(outgoingHero,{opacity:0,x:-dir*62,y:38,scale:.80,rotation:dir*12,filter:'blur(10px)',duration:dur*.28,ease:'power2.in'},dur*.18)
      .to(heroFloor,{opacity:.36,scale:.78,duration:dur*.22,ease:'power2.in'},0)
      .to(heroFloor,{opacity:.90,scale:1.10,duration:dur*.40,ease:'power3.out'},dur*.25)
      .to(title,{opacity:1,x:0,y:-7,scale:1.025,filter:'blur(0px)',duration:dur*.43,ease:'power4.out'},dur*.31)
      .to(titleFlare,{opacity:.95,scaleX:1,duration:dur*.25,ease:'power4.out'},dur*.34)
      .to(titleFlare,{opacity:0,xPercent:dir>0?115:-115,duration:dur*.34,ease:'power2.in'},dur*.50)
      .fromTo([sourceBadge,meta,desc,counter],{opacity:0,y:18},{opacity:1,y:0,duration:dur*.34,ease:'power3.out',stagger:dur*.025},dur*.40);

    /* SETTLE — a small overshoot gives the half-turn weight, then everything lands. */
    tl.to(p,{v:targetRound,duration:dur*.18,ease:'power2.out',onUpdate(){progress=p.v;placeLabels()}},dur*.82)
      .to(incomingHero,{y:0,scale:1,duration:dur*.18,ease:'power2.out'},dur*.77)
      .to(heroFloor,{opacity:.72,scale:1,duration:dur*.18,ease:'power2.out'},dur*.77)
      .to(title,{y:0,scale:1,color:'#f7f5ef',duration:dur*.22,ease:'power2.out'},dur*.72);
  }

  function animateTo(target,duration=.82){
    const targetRound=Math.round(target),i=normalize(targetRound,items.length);
    if(!items.length)return;
    if(i===active)animateProgressOnly(targetRound,duration);
    else transitionTo(targetRound,duration);
  }

  function step(dir){
    if(!isHalf()||!items.length)return;
    const base=goal===null?Math.round(progress):Math.round(goal);
    animateTo(base+dir,.82);
  }

  function goTo(index){
    if(!isHalf()||!items.length)return;
    const n=items.length,target=normalize(index,n);
    const base=goal===null?Math.round(progress):Math.round(goal);
    const now=normalize(base,n);
    let d=target-now;while(d>n/2)d-=n;while(d<-n/2)d+=n;
    if(d)animateTo(base+d,.84);
  }

  function settle(){
    const projected=progress-velocity*(isMobile()?.22:.28);
    animateTo(Math.round(projected),.78);
  }

  function onDown(e){
    if(!isHalf()||!items.length||e.button>0)return;
    if(e.target.closest?.(INTERACTIVE)){e.stopPropagation();return}
    e.stopPropagation();
    if(tween){tween.kill();tween=null;goal=null;renderImmediate(activeIndex())}
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=lastX=e.clientX;startProgress=progress;lastT=e.timeStamp||performance.now();velocity=0;
    root.dataset.halfOrbitDrag='1';
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
    if(!moved){animateProgressOnly(Math.round(startProgress),.24);return}
    const travel=Math.abs(progress-startProgress),fling=Math.abs(velocity)>.45;
    (travel>.22||fling)?settle():animateProgressOnly(Math.round(startProgress),.40);
  }

  function onWheel(e){if(isHalf())e.stopPropagation()}

  function onKey(e){
    if(!isHalf())return;
    if(e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();step(1)}
    else if(e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();step(-1)}
  }

  const onPrevClick=e=>{e.stopPropagation();step(-1)};
  const onNextClick=e=>{e.stopPropagation();step(1)};
  const onDetailClick=e=>{e.stopPropagation();window.RestaurantOrbit?.openDetail?.()};

  function bind(){
    if(mounted||!stage)return;mounted=true;
    stage.addEventListener('pointerdown',onDown);
    stage.addEventListener('pointermove',onMove);
    stage.addEventListener('pointerup',onUp);
    stage.addEventListener('pointercancel',onUp);
    stage.addEventListener('wheel',onWheel,{passive:true});
    stage.addEventListener('keydown',onKey);
    prevBtn.addEventListener('click',onPrevClick);
    nextBtn.addEventListener('click',onNextClick);
    detailBtn.addEventListener('click',onDetailClick);
    addEventListener('resize',placeLabels);
  }

  function unbind(){
    if(!mounted)return;mounted=false;
    stage?.removeEventListener('pointerdown',onDown);stage?.removeEventListener('pointermove',onMove);
    stage?.removeEventListener('pointerup',onUp);stage?.removeEventListener('pointercancel',onUp);
    stage?.removeEventListener('wheel',onWheel);stage?.removeEventListener('keydown',onKey);
    prevBtn?.removeEventListener('click',onPrevClick);nextBtn?.removeEventListener('click',onNextClick);
    detailBtn?.removeEventListener('click',onDetailClick);
    removeEventListener('resize',placeLabels);
  }

  function ensureStudio(){
    const panel=$('.studio-panel.motion-panel');if(!panel||$('.hos-studio',panel))return;
    studioCard=document.createElement('article');studioCard.className='motion-card hos-studio';
    studioCard.innerHTML=`
      <div class="motion-card-head"><div><span class="motion-number">12</span><strong>Half Orbit Selector</strong></div><span class="motion-badge">NUEVO</span></div>
      <p>Media circunferencia tipográfica. El producto activo ocupa el centro; cada cambio hace un barrido cromático de 180° y eleva el titular.</p>
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
      `${source()==='pizzas'?'Pizzas':'Platos'} · ${items.length||'—'} productos · drag + flechas · transición cromática 180°`;
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
      if(!mounted)shellTouchAction=shell.style.touchAction;
      shell.style.touchAction='pan-y';stage.hidden=false;bind();
      await loadItems({reset:lastSource!==source()});
      root.dataset.halfOrbit='ready';root.dataset.orbitalChoreography='half-orbit-v3';
      syncStudio();
    }else{
      tween?.kill?.();tween=null;goal=null;dragging=false;pointerId=null;delete root.dataset.halfOrbitDrag;
      unbind();
      if(stage)stage.hidden=true;if(shell)shell.style.touchAction=shellTouchAction;
      delete root.dataset.halfOrbit;delete root.dataset.halfOrbitTransition;
      if(root.dataset.orbitalChoreography?.startsWith('half-orbit'))delete root.dataset.orbitalChoreography;
      syncStudio();
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

  new MutationObserver(()=>activate()).observe(root,{attributes:true,attributeFilter:['data-orbital-motion']});
  document.addEventListener('restaurant:config-applied',async()=>{
    ensureStudio();
    if(isHalf()&&!dragging&&!tween)await loadItems({reset:lastSource!==source()});
    else syncStudio();
  });

  function state(){return {ready:root.dataset.halfOrbit==='ready',mode:root.dataset.orbitalMotion,
    source:source(),progress,activeIndex:activeIndex(),count:items.length,dragging,mounted,
    activeId:items[activeIndex()]?.id||null,activeName:items[activeIndex()]?.name||null,
    halfTurnDeg:+(progress*180).toFixed(2),transition:stage?.dataset.transition==='1',
    transitionDirection:stage?.dataset.direction||null,review,reduced:reduced.matches}}

  function boot(){
    if(ready)return;
    if(!window.gsap||!window.RestaurantOrbit||!window.RestaurantStudioConfig||!$('.orbit-shell'))return;
    if(!injectOption())return;
    ready=true;ensureStyles();ensureStage();ensureStudio();activate();restoreSavedChoice();
  }

  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},120);
  setTimeout(()=>clearInterval(timer),20000);boot();

  window.RestaurantHalfOrbit={MODE,activate,step,goTo,
    setProgress(v){tween?.kill?.();tween=null;goal=null;progress=Number(v)||0;renderImmediate(activeIndex())},
    subscribe(fn){if(typeof fn!=='function')return()=>{};observers.add(fn);return()=>observers.delete(fn)},
    state,items:()=>items.map(x=>({...x,raw:undefined}))};
})();
