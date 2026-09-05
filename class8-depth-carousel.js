/* CLASS 08 · PROJECT 01 — CINEMATIC DEPTH CAROUSEL
   Additive Motion Engine preset. Selected from Studio → Motion → "Depth Carousel".

   Architecture (same contract proven by Class 07 Editorial Flow):
     · The Orbital Engine (app-v4 / class4-runtime-guard) remains the AUTHORITATIVE
       dish state. #dish-counter is the single source of truth for the active index.
     · This engine owns only the VISIBLE choreography: it renders its own plate layer
       inside .orbit-shell while #orbit-stage is hidden by styles-v8.css.
     · Navigation is committed back to the base engine by clicking the real base dish,
       so copy, detail, Class 06 product layer and Studio keep working untouched.

   What is new versus every previous choreography:
     · a horizontal 2.5D depth TRACK with non-linear slot spacing, so plates travel
       different distances and arcs — the source of the parallax/depth sensation;
     · CONTINUOUS drag (position follows the pointer every frame) with velocity
       momentum and snap, instead of a swipe that fires a single discrete step;
     · a synchronized SCENE: wash, giant lettering, accent, copy, price, ingredients
       and indicators move/change as one, at different parallax rates.
*/
(() => {
  'use strict';
  if(!window.gsap)return;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const shell=$('.orbit-shell'), baseStage=$('#orbit-stage'), copy=$('.dish-copy'), controls=$('.orbit-controls');
  if(!shell||!baseStage||!copy)return;

  const MODE='depth-carousel';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const PALETTE=['#d8ff4f','#ef914f','#6aa7e8','#a9dfa0','#d7b8bb','#9270dc','#e9c94c','#73c86b'];
  const WORD_OPACITY=.20;

  /* Depth track. Slot spacing is deliberately NON-linear:
     0→1 travels ~23% of the shell, 1→2 ~14%, 2→3 ~11%. Vertical arc shrinks the same way.
     Equal spacing would look like a plain slider; unequal spacing reads as distance. */
  const TRACK_DESKTOP={
    '-3':{x: 6,y:34,s:.28,o:0,  b:5.0,r:-9},
    '-2':{x:17,y:38,s:.42,o:.40,b:3.2,r:-7},
    '-1':{x:30,y:45,s:.66,o:.85,b:1.1,r:-4.5},
    '0' :{x:50,y:57,s:1.18,o:1, b:0,  r:0},
    '1' :{x:70,y:45,s:.66,o:.85,b:1.1,r:4.5},
    '2' :{x:83,y:38,s:.42,o:.40,b:3.2,r:7},
    '3' :{x:94,y:34,s:.28,o:0,  b:5.0,r:9}
  };
  const TRACK_MOBILE={
    '-3':{x:-4, y:28,s:.30,o:0,  b:4.4,r:-11},
    '-2':{x:10, y:32,s:.46,o:.34,b:3.0,r:-9},
    '-1':{x:24, y:39,s:.68,o:.72,b:1.3,r:-5},
    '0' :{x:50, y:55,s:1.18,o:1, b:0,  r:0},
    '1' :{x:76, y:39,s:.68,o:.72,b:1.3,r:5},
    '2' :{x:90, y:32,s:.46,o:.34,b:3.0,r:9},
    '3' :{x:104,y:28,s:.30,o:0,  b:4.4,r:11}
  };

  let scene=null,washEl=null,wordEl=null,platesHost=null,dotsEl=null,copyEl=null,priceEl=null,ingEl=null;
  let position=0,activeIndex=0,snapTween=null,breathTween=null;
  let dragging=false,pointerId=null,startX=0,startPos=0,lastX=0,lastT=0,velocity=0,moved=false;
  let lastWheel=0,internalPass=false,booted=false,meta=new Map();
  let baseSyncTarget=null,baseSyncTimer=null;

  const isDepth=()=>root.dataset.orbitalMotion===MODE;
  const detailOpen=()=>root.dataset.dishDetail==='open'||document.body.classList.contains('detail-open');
  const isMobile=()=>innerWidth<700;
  const baseDishes=()=>$$('.orbit-dish',baseStage);
  const count=()=>baseDishes().length;
  const normalize=(n,total=count())=>total?((n%total)+total)%total:0;
  const counterIndex=()=>{const n=parseInt($('#dish-counter')?.textContent||'',10);return Number.isFinite(n)?Math.max(0,n-1):0};
  const plates=()=>platesHost?$$('.dc-plate',platesHost):[];

  /* ---------- data: reuse the real dish model, never a second one ---------- */
  const firstWord=name=>String(name||'').trim().split(/[\s/·—-]+/).filter(Boolean)[0]||'DISH';
  function defaultMeta(dish,i){
    return {
      word:firstWord(dish?.name),
      accent:dish?.editorialFlow?.color||PALETTE[i%PALETTE.length]
    };
  }
  async function loadMeta(){
    let dishes=window.RestaurantDefaults?.dishes||[];
    try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config?.dishes?.length)dishes=saved.config.dishes}catch{}
    meta=new Map(dishes.filter(d=>d.enabled!==false).map((d,i)=>[d.id,{...defaultMeta(d,i),...(d.depthCarousel||{}),dish:d}]));
  }
  function dishFor(index){
    const el=baseDishes()[normalize(index)];
    const id=el?.dataset.id;
    if(id&&meta.has(id))return meta.get(id);
    const list=(window.RestaurantDefaults?.dishes||[]).filter(d=>d.enabled!==false);
    const d=list[normalize(index,list.length||1)]||{};
    return {...defaultMeta(d,normalize(index)),dish:d};
  }

  /* ---------- studio ---------- */
  function injectStudioOption(){
    const select=$('#motion-orbital-style');
    if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const option=document.createElement('option');
      option.value=MODE;option.textContent='Depth Carousel';
      select.appendChild(option);
    }
    return true;
  }
  function ensureStyles(){
    if($('link[data-depth-carousel-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v8.css';l.dataset.depthCarouselStyles='1';
    document.head.appendChild(l);
  }

  /* ---------- scene ---------- */
  function ensureScene(){
    if(scene?.isConnected)return;
    scene=document.createElement('div');scene.className='dc-scene';scene.setAttribute('aria-hidden','true');
    washEl=document.createElement('div');washEl.className='dc-wash';
    wordEl=document.createElement('div');wordEl.className='dc-word';
    platesHost=document.createElement('div');platesHost.className='dc-plates';
    scene.append(washEl,wordEl,platesHost);
    shell.appendChild(scene);

    if(!$('.dc-copy',copy)){
      copyEl=document.createElement('div');copyEl.className='dc-copy';
      copyEl.innerHTML='<span class="dc-price"></span><span class="dc-ingredients"></span>';
      const explore=$('#explore-dish');
      explore?copy.insertBefore(copyEl,explore):copy.appendChild(copyEl);
    }
    priceEl=$('.dc-price',copy);ingEl=$('.dc-ingredients',copy);

    if(controls&&!$('.dc-dots',controls)){
      dotsEl=document.createElement('div');dotsEl.className='dc-dots';
      dotsEl.setAttribute('role','tablist');dotsEl.setAttribute('aria-label','Seleccionar plato');
      controls.appendChild(dotsEl);
    }else dotsEl=$('.dc-dots',controls||document);
  }

  function rebuild(){
    ensureScene();
    if(detailOpen())return;
    const items=baseDishes();
    if(!items.length)return;
    platesHost.innerHTML='';
    items.forEach((base,i)=>{
      const img=$('img',base);if(!img)return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='dc-plate';btn.tabIndex=-1;
      btn.dataset.id=base.dataset.id||'';btn.dataset.index=String(i);
      const clone=img.cloneNode(true);clone.removeAttribute('style');btn.appendChild(clone);
      platesHost.appendChild(btn);
    });
    if(dotsEl){
      dotsEl.innerHTML='';
      items.forEach((_,i)=>{
        const dot=document.createElement('button');
        dot.type='button';dot.className='dc-dot';dot.dataset.index=String(i);
        dot.setAttribute('aria-label',`Plato ${i+1}`);
        dotsEl.appendChild(dot);
      });
    }
    activeIndex=counterIndex();position=activeIndex;
    renderAt(position);syncScene(activeIndex,false);
  }

  /* ---------- track sampling ---------- */
  const lerp=(a,b,t)=>a+(b-a)*t;
  function sampleTrack(distance){
    const table=isMobile()?TRACK_MOBILE:TRACK_DESKTOP;
    const d=Math.max(-3,Math.min(3,distance));
    const lo=Math.floor(d),hi=Math.ceil(d),t=d-lo;
    const A=table[String(lo)],B=table[String(hi)]||A;
    return {x:lerp(A.x,B.x,t),y:lerp(A.y,B.y,t),s:lerp(A.s,B.s,t),o:lerp(A.o,B.o,t),b:lerp(A.b,B.b,t),r:lerp(A.r,B.r,t)};
  }
  function wrapped(i,pos,total){let d=i-pos;while(d>total/2)d-=total;while(d<-total/2)d+=total;return d}

  function renderAt(pos){
    const list=plates(),n=list.length;
    if(!n)return;
    const W=shell.clientWidth,H=shell.clientHeight,mobile=isMobile();
    list.forEach((plate,i)=>{
      const d=wrapped(i,pos,n),slot=sampleTrack(d),hero=Math.abs(d)<.42;
      /* secondary arc: mid-transition trajectories curve instead of running straight,
         and the curvature differs per slot — this is what stops it reading as a slider. */
      const arc=Math.sin(Math.max(-3,Math.min(3,d))*Math.PI/1.5)*(mobile?5:11);
      const visible=slot.o>.03;
      gsap.set(plate,{
        xPercent:-50,yPercent:-50,
        x:slot.x/100*W, y:slot.y/100*H+arc,
        scale:slot.s, rotation:slot.r, opacity:slot.o,
        filter:visible?`blur(${slot.b.toFixed(2)}px) brightness(${(0.62+(1-Math.min(1,Math.abs(d)/2.2))*0.44).toFixed(3)})`:'none',
        zIndex:100-Math.round(Math.abs(d)*12),
        pointerEvents:visible?'auto':'none'
      });
      plate.classList.toggle('is-hero',hero);
    });
    /* parallax: three layers, three rates. */
    /* Parallax is driven by the offset from the nearest slot, not by the absolute
       position: an absolute rate drifts the background layers further off-centre with
       every step and eventually pushes the lettering out of frame. This oscillates
       around zero, so the layers lag during motion and always resolve centred.
       xPercent/yPercent are mandatory: gsap writes the whole transform and would
       otherwise drop the CSS translate(-50%,-50%) that centres both layers. */
    const frac=pos-Math.round(pos);
    if(wordEl)gsap.set(wordEl,{xPercent:-50,yPercent:-50,x:-frac*(mobile?52:104),opacity:WORD_OPACITY});
    if(washEl)gsap.set(washEl,{xPercent:-50,yPercent:-50,x:-frac*(mobile?22:44)});
  }

  /* ---------- scene synchronisation ---------- */
  function syncScene(index,animate=true){
    const info=dishFor(index),d=info.dish||{};
    root.style.setProperty('--dc-accent',info.accent);
    if(dotsEl)$$('.dc-dot',dotsEl).forEach((dot,i)=>dot.setAttribute('aria-current',String(i===normalize(index))));
    const setText=()=>{
      if(wordEl)wordEl.textContent=info.word;
      if(priceEl)priceEl.textContent=d.price||'';
      if(ingEl)ingEl.textContent=d.ingredients||d.meta||'';
    };
    if(!animate||reduced.matches){setText();if(wordEl)gsap.set(wordEl,{xPercent:-50,yPercent:-50,opacity:WORD_OPACITY});return}
    gsap.killTweensOf([wordEl,priceEl,ingEl].filter(Boolean));
    const tl=gsap.timeline();
    tl.to([wordEl,priceEl,ingEl].filter(Boolean),{opacity:0,duration:.16,ease:'power2.in'},0)
      .add(setText)
      .fromTo(wordEl,{opacity:0,y:16},{opacity:WORD_OPACITY,y:0,duration:.5,ease:'power3.out'},'>')
      .fromTo([priceEl,ingEl].filter(Boolean),{opacity:0,y:10},{opacity:1,y:0,duration:.38,stagger:.05,ease:'power3.out'},'<');
  }

  /* ---------- breathing (idle physicality) ---------- */
  function stopBreath(){breathTween?.kill?.();breathTween=null;const hero=plates()[normalize(activeIndex)];if(hero)gsap.set($('img',hero),{y:0,scale:1})}
  function startBreath(){
    stopBreath();
    if(!isDepth()||reduced.matches||detailOpen()||dragging)return;
    const hero=plates()[normalize(activeIndex)],img=hero&&$('img',hero);
    if(!img)return;
    breathTween=gsap.to(img,{y:-6,scale:1.012,duration:2.4,ease:'sine.inOut',yoyo:true,repeat:-1});
  }

  /* ---------- commit back to the authoritative Orbital Engine ---------- */
  function passBaseClick(el){internalPass=true;try{el?.click()}finally{queueMicrotask(()=>{internalPass=false})}}
  function syncBaseTo(index){
    const target=normalize(index);
    clearTimeout(baseSyncTimer);
    if(counterIndex()===target){baseSyncTarget=null;return}
    /* The base engine tweens to the target and its counter SWEEPS through every
       intermediate index on the way. Without this latch the counter observer would
       read those intermediate values as an external change and chase them back. */
    baseSyncTarget=target;
    baseSyncTimer=setTimeout(()=>{baseSyncTarget=null},1800);
    const el=baseDishes()[target];
    /* app-v4 / runtime-guard bind: click on a non-active dish === goToIndex(i).
       Programmatic clicks carry clientX/Y 0, so the Class 06 hero bridge ignores them. */
    if(el)passBaseClick(el);
  }
  function openActiveDetail(){
    const base=baseDishes()[normalize(activeIndex)];
    if(!base)return;
    alignBaseToHero(base);
    if(typeof window.RestaurantClass6Detail?.open==='function')window.RestaurantClass6Detail.open(base);
    else passBaseClick(base);
  }
  /* The base dish is hidden behind our plate. Park it on the hero's real geometry so the
     GSAP Flip transition into the dish detail starts where the user actually sees it. */
  function alignBaseToHero(base){
    try{
      const hero=plates()[normalize(activeIndex)];if(!hero)return;
      const hr=hero.getBoundingClientRect(),sr=shell.getBoundingClientRect(),br=base.getBoundingClientRect();
      if(!hr.width||!br.width)return;
      const natural=br.width/(gsap.getProperty(base,'scaleX')||1);
      gsap.set(base,{xPercent:-50,yPercent:-50,rotation:0,opacity:1,filter:'none',zIndex:120,
        x:hr.left+hr.width/2-sr.left-sr.width/2,
        y:hr.top+hr.height/2-sr.top-sr.height/2,
        scale:hr.width/natural});
    }catch{}
  }

  /* ---------- motion ---------- */
  function snapTo(target,duration){
    snapTween?.kill?.();
    stopBreath();
    const state={p:position};
    const dist=Math.abs(target-position);
    const dur=reduced.matches?.01:(duration??Math.min(1.05,.42+dist*.28));
    const landed=normalize(Math.round(target));
    snapTween=gsap.to(state,{
      p:target,duration:dur,ease:reduced.matches?'none':'power3.out',
      onUpdate(){position=state.p;renderAt(position);trackActive()},
      onComplete(){position=target;renderAt(position);setActive(landed);root.dataset.orbitalChoreography='depth-carousel-v1';startBreath()}
    });
    syncBaseTo(landed);
  }
  function setActive(index){
    const next=normalize(index);
    if(next===activeIndex)return;
    activeIndex=next;syncScene(activeIndex,true);
  }
  function trackActive(){setActive(Math.round(position))}

  function step(direction=1){
    if(!isDepth()||detailOpen()||!count())return;
    snapTo(Math.round(position)+direction);
  }
  function goTo(index){
    if(!isDepth()||detailOpen()||!count())return;
    const n=count();let d=normalize(index)-normalize(Math.round(position));
    while(d>n/2)d-=n;while(d<-n/2)d+=n;
    snapTo(Math.round(position)+d);
  }

  /* ---------- continuous drag + momentum ---------- */
  const dragUnit=()=>shell.clientWidth*(isMobile()?.32:.24);
  function onDown(e){
    if(!isDepth()||detailOpen()||!count())return;
    if(e.target.closest('.dc-dot,#next-dish,#prev-dish,#explore-dish'))return;
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=lastX=e.clientX;startPos=position;lastT=e.timeStamp||performance.now();velocity=0;
    snapTween?.kill?.();stopBreath();
    try{shell.setPointerCapture?.(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    const now=e.timeStamp||performance.now(),dt=Math.max(1,now-lastT);
    const inst=(e.clientX-lastX)/dt;
    velocity=velocity*.6+inst*.4;
    lastX=e.clientX;lastT=now;
    if(Math.abs(e.clientX-startX)>7)moved=true;
    position=startPos-(e.clientX-startX)/dragUnit();
    renderAt(position);trackActive();
  }
  function onUp(e){
    if(!dragging||(pointerId!==null&&e.pointerId!==pointerId))return;
    dragging=false;pointerId=null;
    try{shell.releasePointerCapture?.(e.pointerId)}catch{}
    if(!moved){snapTo(Math.round(position));return}
    /* project the flick: 180ms of travel at the smoothed release velocity */
    const projected=-(velocity*180)/dragUnit();
    const offset=Math.max(-2,Math.min(2,projected));
    snapTo(Math.round(position+offset));
  }

  /* ---------- input ownership (capture phase, guarded by mode) ---------- */
  document.addEventListener('pointerdown',e=>{
    if(!isDepth()||!shell.contains(e.target))return;
    /* Exclusive ownership: app-v4, Elegant and Urban all bind their own shell drag.
       Two drag owners on one surface is exactly the Class 04 failure mode. */
    e.stopImmediatePropagation();onDown(e);
  },true);
  document.addEventListener('pointermove',e=>{if(!dragging)return;e.stopImmediatePropagation();onMove(e)},true);
  document.addEventListener('pointerup',e=>{if(!dragging)return;e.stopImmediatePropagation();onUp(e)},true);
  document.addEventListener('pointercancel',e=>{if(!dragging)return;e.stopImmediatePropagation();dragging=false;pointerId=null;snapTo(Math.round(position))},true);

  /* Runs before the Class 06 hero bridge (document capture precedes .orbit-shell capture),
     so a drag release can never be mistaken for a "open the dish" click. */
  document.addEventListener('click',e=>{
    if(!isDepth()||internalPass||detailOpen())return;
    if(e.target.closest('.dc-dot')){
      e.preventDefault();e.stopImmediatePropagation();
      goTo(Number(e.target.closest('.dc-dot').dataset.index));return;
    }
    const nav=e.target.closest('#next-dish,#prev-dish');
    if(nav){e.preventDefault();e.stopImmediatePropagation();step(nav.id==='next-dish'?1:-1);return}
    if(e.target.closest('#explore-dish')){e.preventDefault();e.stopImmediatePropagation();openActiveDetail();return}
    if(!shell.contains(e.target))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(moved){moved=false;return}
    const plate=e.target.closest('.dc-plate');
    if(!plate)return;
    const idx=Number(plate.dataset.index);
    if(normalize(idx)===normalize(activeIndex))openActiveDetail();else goTo(idx);
  },true);

  document.addEventListener('wheel',e=>{
    if(!isDepth()||detailOpen()||!shell.contains(e.target))return;
    const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(Math.abs(delta)<4)return;
    e.preventDefault();e.stopImmediatePropagation();
    const now=performance.now();if(now-lastWheel<420)return;
    lastWheel=now;step(delta>=0?1:-1);
  },{capture:true,passive:false});

  document.addEventListener('keydown',e=>{
    if(!isDepth()||detailOpen()||!shell.contains(document.activeElement))return;
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation();step(e.key==='ArrowRight'?1:-1)}
    else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();openActiveDetail()}
  },true);

  /* ---------- lifecycle ---------- */
  function activate(){
    injectStudioOption();ensureStyles();ensureScene();
    if(isDepth()){
      if(plates().length!==count())rebuild();
      scene.hidden=false;
      activeIndex=counterIndex();position=activeIndex;
      renderAt(position);syncScene(activeIndex,false);startBreath();
      root.dataset.depthCarousel='ready';
      root.dataset.orbitalChoreography='depth-carousel-v1';
    }else{
      if(scene)scene.hidden=true;
      snapTween?.kill?.();stopBreath();dragging=false;
      delete root.dataset.depthCarousel;
      root.style.removeProperty('--dc-accent');
    }
  }

  new MutationObserver(()=>{
    if(!isDepth())return;
    const idx=counterIndex();
    if(baseSyncTarget!==null){
      if(idx===baseSyncTarget){baseSyncTarget=null;clearTimeout(baseSyncTimer)}
      return;
    }
    if(dragging||snapTween?.isActive())return;
    if(idx!==activeIndex)goTo(idx);
  }).observe($('#dish-counter')||copy,{subtree:true,childList:true,characterData:true});

  new MutationObserver(()=>{
    /* app-v4 moves the real dish node into #detail-visual while the detail is open.
       Rebuilding then would leave the scene one plate short — a Class 04 style regression. */
    if(!isDepth()||detailOpen())return;
    setTimeout(()=>{if(isDepth()&&!detailOpen())rebuild()},40);
  }).observe(baseStage,{childList:true});

  window.addEventListener('restaurant:motion-change',()=>setTimeout(activate,0));
  window.addEventListener('restaurant:dish-detail-open',()=>{dragging=false;snapTween?.kill?.();stopBreath()});
  window.addEventListener('restaurant:dish-detail-close',()=>setTimeout(()=>{if(isDepth()){rebuild();activate()}},260));
  reduced.addEventListener?.('change',activate);
  addEventListener('resize',()=>{if(isDepth()){renderAt(position)}});

  async function restoreStudioMode(){
    if(!injectStudioOption())return;
    try{
      const saved=await window.RestaurantStore?.loadProject?.();
      if(saved?.config?.motion?.orbitalStyle===MODE){
        const select=$('#motion-orbital-style');
        if(select){select.value=MODE;window.RestaurantMotionStudio?.publish?.()}
      }
    }catch{}
  }

  async function boot(){
    if(booted)return;booted=true;
    injectStudioOption();ensureStyles();ensureScene();
    await loadMeta();
    rebuild();
    await restoreStudioMode();
    setTimeout(activate,60);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,260));
  else setTimeout(boot,260);

  window.RestaurantDepthCarousel={
    MODE,activate,rebuild,step,goTo,renderAt,sampleTrack,
    state:()=>({position,activeIndex,plates:plates().length,mode:root.dataset.orbitalMotion})
  };
})();
