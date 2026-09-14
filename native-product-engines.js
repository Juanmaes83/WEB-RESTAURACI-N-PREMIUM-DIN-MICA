/* MOTION 15 — THREE NATIVE PRODUCT ENGINES

   Native siblings of the approved full-page Experiences. The three Experiences stay
   untouched in Class 22. This runtime only owns the product-area presentation and
   reads the existing Project State.

   circular-product is the real full-pizza Circular Dish Rotator grammar: one baked
   eight-sector pizza, fixed selector, lifted active wedge and the existing
   pizzaSliceOrbit product domain. It is not a generic radial menu.
*/
(() => {
  'use strict';

  const MODES=new Set(['circular-product','dish-stage-product','cinematic-rail-product']);
  const CIRCULAR_ORDER=['Diavola','Prosciutto Funghi','4 Quesos','Mortadela y Pistacho','Carbonara','Barbacoa','Verduras','Margarita'];
  const FULL_PIZZA='assets/pizza-motion/runtime/full-pizza/full-pizza.png';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const mod=(v,n)=>((v%n)+n)%n;
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');

  let host=null;
  let mode='';
  let index=0;
  let progress=0;
  let drag=null;
  let anim=null;
  let detail=null;

  const config=(path)=>window.RestaurantStudioConfig?.get?.(path);
  const dishes=()=>{
    const list=config('dishes')||window.RestaurantDefaults?.dishes||[];
    return list.filter(d=>d&&d.enabled!==false);
  };
  const pizzaProducts=()=>{
    const list=config('pizzaSliceOrbit.products')||window.RestaurantDefaults?.pizzaSliceOrbit?.products||[];
    const byName=new Map(list.map(p=>[norm(p?.name),p]));
    return CIRCULAR_ORDER.map((name,i)=>{
      const p=byName.get(norm(name))||{};
      return {
        id:p.id||`pizza-${i+1}`,
        name:p.name||name,
        meta:[p.mood,p.descriptor].filter(Boolean).join(' · '),
        short:p.headlineTail||p.headlineLead||p.descriptor||'',
        price:p.price??null,
        ingredients:p.ingredients||'',
        accent:p.accent||'#ff5a36',
        demoContent:p.demoContent===true
      };
    });
  };
  const items=()=>mode==='circular-product'?pizzaProducts():dishes();
  const item=()=>items()[mod(index,Math.max(1,items().length))]||null;
  const accentOf=d=>d?.accent||d?.depthCarousel?.accent||window.RestaurantDefaults?.brand?.accent||'#d8ff4f';
  const worldOf=d=>d?.background?.a||d?.depthCarousel?.backgroundColor||'#100806';

  function ensureStyles(){
    if(!$('link[data-native-product-engines-styles]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='styles-native-product-engines.css';l.dataset.nativeProductEnginesStyles='1';document.head.appendChild(l);
    }
  }

  function ensureHost(){
    if(host?.isConnected)return host;
    const shell=$('.orbit-shell');
    if(!shell)return null;
    ensureStyles();
    host=document.createElement('div');
    host.className='npe-stage';host.hidden=true;host.inert=true;
    host.setAttribute('aria-live','polite');
    shell.appendChild(host);
    return host;
  }

  function commonCopy(d,kind){
    const count=items().length;
    const kicker=kind==='circular-product'?'PIZZA SELECTION · FULL PIZZA ENGINE':kind==='dish-stage-product'?'SIGNATURE DISH · CINEMATIC STAGE':'MENU STORY · CINEMATIC RAIL';
    return `<div class="npe-copy">
      <p class="npe-kicker">${kicker}</p>
      <h3 class="npe-title" data-npe-title></h3>
      <p class="npe-short" data-npe-short></p>
      <div class="npe-copy-foot"><span class="npe-price" data-npe-price></span><button class="npe-detail" data-npe-detail type="button">Ver producto ↗</button></div>
    </div>
    <div class="npe-controls" aria-label="Navegación de productos">
      <button type="button" data-npe-prev aria-label="Anterior">←</button>
      ${kind==='circular-product'?'<button type="button" class="npe-spin" data-npe-spin aria-label="Descubrir pizza">↻</button>':''}
      <span data-npe-counter>${String(index+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}</span>
      <button type="button" data-npe-next aria-label="Siguiente">→</button>
    </div>`;
  }

  function mountCircular(){
    const d=item();
    host.className='npe-stage npe-circular-product';
    host.innerHTML=`<div class="npe-world"></div><div class="npe-grain"></div>
      <div class="npe-cdr-word" data-npe-world-word aria-hidden="true"></div>
      <div class="npe-cdr" tabindex="0" role="application" aria-label="Selector circular de pizza completa. Arrastra alrededor de la pizza o usa las flechas.">
        <div class="npe-cdr-beam" aria-hidden="true"></div>
        <div class="npe-cdr-disc-wrap">
          <div class="npe-cdr-shadow" aria-hidden="true"></div>
          <img class="npe-cdr-disc" data-npe-disc draggable="false" alt="Pizza completa formada por ocho variedades" src="${FULL_PIZZA}">
          <div class="npe-cdr-sector-window" aria-hidden="true"><img class="npe-cdr-sector-disc" data-npe-sector-disc draggable="false" alt="" src="${FULL_PIZZA}"></div>
          <div class="npe-cdr-selector" aria-hidden="true"></div>
          <div class="npe-cdr-center" aria-hidden="true"><span></span></div>
        </div>
        <p class="npe-cdr-selected"><span>PORCIÓN SELECCIONADA</span><strong data-npe-selected></strong></p>
      </div>
      ${commonCopy(d,'circular-product')}
      <div class="npe-pizza-dialog" data-npe-pizza-dialog aria-hidden="true" role="dialog" aria-modal="true">
        <button class="npe-pizza-dialog-close" data-npe-dialog-close type="button" aria-label="Cerrar">×</button>
        <p data-npe-dialog-meta></p><h3 data-npe-dialog-title></h3><p data-npe-dialog-ingredients></p>
      </div>`;
    bindCommon();
    bindCircular();
    renderCircular(true);
  }

  function bindCircular(){
    const surface=$('.npe-cdr',host);
    if(!surface)return;
    const angle=e=>{const r=surface.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;return Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI};
    const delta=(a,b)=>{let d=a-b;while(d>180)d-=360;while(d<-180)d+=360;return d};
    surface.addEventListener('pointerdown',e=>{
      cancelAnim();
      drag={id:e.pointerId,angle:angle(e),progress};
      surface.setPointerCapture?.(e.pointerId);host.dataset.dragging='true';
    });
    surface.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const next=angle(e),d=delta(next,drag.angle);drag.angle=next;progress-=d/45;drag.progress=progress;renderCircular(false);
    });
    const end=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      surface.releasePointerCapture?.(e.pointerId);drag=null;delete host.dataset.dragging;
      goTo(Math.round(progress),420);
    };
    surface.addEventListener('pointerup',end);surface.addEventListener('pointercancel',end);
    surface.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'){e.preventDefault();step(1)}
      else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();discover()}
    });
    $('[data-npe-spin]',host)?.addEventListener('click',discover);
  }

  function renderCircular(){
    const list=items();if(!list.length)return;
    index=mod(Math.round(progress),list.length);
    const d=list[index];
    const deg=-22.5-progress*45;
    host.style.setProperty('--npe-accent',accentOf(d));host.style.setProperty('--npe-world',worldOf(d));
    const disc=$('[data-npe-disc]',host),sector=$('[data-npe-sector-disc]',host);
    if(disc)disc.style.transform=`rotate(${deg}deg)`;
    if(sector)sector.style.transform=`rotate(${deg}deg)`;
    host.dataset.activeIndex=String(index);
    renderCopy(d);
    const selected=$('[data-npe-selected]',host);if(selected)selected.textContent=d.name||'';
    const word=$('[data-npe-world-word]',host);if(word)word.textContent=(d.meta||d.name||'PIZZA').split(' · ')[0].toUpperCase();
  }

  function cancelAnim(){if(anim){cancelAnimationFrame(anim);anim=null}}
  function animateCircular(target,duration=520){
    cancelAnim();
    if(reduced.matches||duration<=0){progress=target;renderCircular();return Promise.resolve()}
    const start=progress,delta=target-start,t0=performance.now();
    return new Promise(resolve=>{
      const frame=now=>{const p=clamp((now-t0)/duration,0,1),ease=1-Math.pow(1-p,4);progress=start+delta*ease;renderCircular();if(p<1)anim=requestAnimationFrame(frame);else{anim=null;progress=target;renderCircular();resolve()}};
      anim=requestAnimationFrame(frame);
    });
  }
  function goTo(target,duration=520){return animateCircular(target,duration)}
  function discover(){
    if(mode!=='circular-product')return;
    const n=items().length,current=mod(Math.round(progress),n),targetIndex=Math.floor(Math.random()*n);
    const forward=mod(targetIndex-current,n)||n;
    return animateCircular(Math.round(progress)+n*3+forward,reduced.matches?0:2300);
  }

  function mountDishStage(){
    const d=item();host.className='npe-stage npe-dish-stage-product';
    host.innerHTML=`<div class="npe-world"></div><div class="npe-grain"></div><div class="npe-stage-word" data-npe-word aria-hidden="true"></div>
      <div class="npe-stage-track" tabindex="0" aria-label="Escenario de platos"><div class="npe-stage-line"></div></div>
      ${commonCopy(d,'dish-stage-product')}`;
    const track=$('.npe-stage-track',host);
    items().forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='npe-stage-card';b.dataset.index=i;b.innerHTML=`<img src="${p.depthCarousel?.asset||p.image||''}" alt="${esc(p.name||'Plato')}">`;b.onclick=()=>i===index?openDetail():setIndex(i);track.appendChild(b)});
    bindCommon();bindLinear(track);renderDishStage();
  }
  function renderDishStage(){
    const list=items(),n=list.length;if(!n)return;index=mod(index,n);const d=list[index];host.style.setProperty('--npe-accent',accentOf(d));host.style.setProperty('--npe-world',worldOf(d));
    $$('.npe-stage-card',host).forEach((el,i)=>{let x=i-index;while(x>n/2)x-=n;while(x<-n/2)x+=n;const a=Math.abs(x),scale=1-Math.min(a,3)*.16,tx=x*clamp(innerWidth*.18,170,290),ty=a*30,rot=x*6;el.style.transform=`translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${scale}) rotate(${rot}deg)`;el.style.opacity=String(a>3?0:.35+(1-a/4)*.65);el.style.zIndex=String(50-Math.round(a*10));el.dataset.active=i===index?'1':'0'});
    const word=$('[data-npe-word]',host);if(word)word.textContent=(d.depthCarousel?.word||d.name||'').toUpperCase();renderCopy(d);
  }

  function mountRail(){
    const d=item();host.className='npe-stage npe-cinematic-rail-product';
    host.innerHTML=`<div class="npe-world"></div><div class="npe-grain"></div><div class="npe-rail-word" data-npe-word aria-hidden="true"></div>
      <div class="npe-rail-viewport" tabindex="0" aria-label="Carril cinematográfico"><div class="npe-rail-track"></div></div>
      ${commonCopy(d,'cinematic-rail-product')}`;
    const track=$('.npe-rail-track',host);
    items().forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='npe-rail-card';b.dataset.index=i;b.innerHTML=`<span class="npe-rail-no">${String(i+1).padStart(2,'0')}</span><img src="${p.image||p.depthCarousel?.asset||''}" alt="${esc(p.name||'Plato')}"><strong class="npe-rail-card-title">${esc(p.name||'')}</strong>`;b.onclick=()=>i===index?openDetail():setIndex(i);track.appendChild(b)});
    bindCommon();bindLinear($('.npe-rail-viewport',host));renderRail();
  }
  function renderRail(){
    const list=items(),n=list.length;if(!n)return;index=mod(index,n);const d=list[index];host.style.setProperty('--npe-accent',accentOf(d));host.style.setProperty('--npe-world',worldOf(d));
    $$('.npe-rail-card',host).forEach((el,i)=>{let x=i-index;while(x>n/2)x-=n;while(x<-n/2)x+=n;const a=Math.abs(x),tx=x*clamp(innerWidth*.235,220,360),scale=1-Math.min(a,3)*.11,rot=x*-3;el.style.transform=`translate(-50%,-50%) translateX(${tx}px) translateZ(${-a*120}px) scale(${scale}) rotateY(${rot}deg)`;el.style.opacity=String(a>3?0:.28+(1-a/4)*.72);el.style.zIndex=String(60-Math.round(a*10));el.dataset.active=i===index?'1':'0'});
    const word=$('[data-npe-word]',host);if(word)word.textContent=(d.depthCarousel?.word||d.name||'').toUpperCase();renderCopy(d);
  }

  function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function renderCopy(d){
    const title=$('[data-npe-title]',host),short=$('[data-npe-short]',host),price=$('[data-npe-price]',host),counter=$('[data-npe-counter]',host);
    if(title)title.textContent=d?.name||'';if(short)short.textContent=d?.short||d?.ingredients||'';if(price){price.textContent=d?.price==null?'':String(d.price);price.hidden=!price.textContent}if(counter)counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(items().length).padStart(2,'0')}`;
    host.dataset.activeIndex=String(index);
  }
  function render(){if(mode==='circular-product')renderCircular();else if(mode==='dish-stage-product')renderDishStage();else if(mode==='cinematic-rail-product')renderRail()}
  function step(delta){if(mode==='circular-product')return goTo(Math.round(progress)+delta);setIndex(index+delta)}
  function setIndex(i){const n=items().length;if(!n)return;index=mod(i,n);progress=index;render()}

  function bindCommon(){
    $('[data-npe-prev]',host)?.addEventListener('click',()=>step(-1));$('[data-npe-next]',host)?.addEventListener('click',()=>step(1));$('[data-npe-detail]',host)?.addEventListener('click',openDetail);
  }
  function bindLinear(surface){
    if(!surface)return;let start=null;
    surface.addEventListener('pointerdown',e=>{start={id:e.pointerId,x:e.clientX};surface.setPointerCapture?.(e.pointerId);host.dataset.dragging='true'});
    surface.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x;surface.releasePointerCapture?.(e.pointerId);start=null;delete host.dataset.dragging;if(Math.abs(dx)>42)step(dx<0?1:-1)});
    surface.addEventListener('pointercancel',()=>{start=null;delete host.dataset.dragging});
    surface.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}else if(e.key==='Enter'){e.preventDefault();openDetail()}});
  }

  function openDetail(){
    const d=item();if(!d)return false;
    if(mode!=='circular-product')return window.RestaurantProductDetail?.open?.(d.id,{via:'button'})!==false;
    detail=$('[data-npe-pizza-dialog]',host);if(!detail)return false;
    $('[data-npe-dialog-meta]',detail).textContent=d.meta||'';$('[data-npe-dialog-title]',detail).textContent=d.name||'';$('[data-npe-dialog-ingredients]',detail).textContent=d.ingredients||d.short||'';detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');$('[data-npe-dialog-close]',detail)?.focus();return true;
  }
  function closeCircularDetail(){if(!detail)return;detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true')}

  function activate(next){
    if(!MODES.has(next))return deactivate();
    const h=ensureHost();if(!h)return;
    mode=next;index=0;progress=0;detail=null;h.hidden=false;h.inert=false;
    $('.orbital-section')?.classList.add('npe-active');$('.orbital-section')?.setAttribute('data-native-engine',mode);root.dataset.nativeProductEngine=mode;
    if(mode==='circular-product')mountCircular();else if(mode==='dish-stage-product')mountDishStage();else mountRail();
    $('[data-npe-dialog-close]',host)?.addEventListener('click',closeCircularDetail);
  }
  function deactivate(){
    cancelAnim();mode='';index=0;progress=0;drag=null;detail=null;
    if(host){host.hidden=true;host.inert=true;host.innerHTML='';host.className='npe-stage'}
    $('.orbital-section')?.classList.remove('npe-active');$('.orbital-section')?.removeAttribute('data-native-engine');delete root.dataset.nativeProductEngine;
  }
  function currentMode(e){return e?.detail?.orbital||root.dataset.orbitalMotion||$('#motion-orbital-style')?.value||''}
  function sync(e){const next=currentMode(e);if(MODES.has(next)){if(next!==mode)activate(next);else render()}else if(mode)deactivate()}

  window.addEventListener('restaurant:motion-change',sync);
  document.addEventListener('restaurant:config-applied',sync);
  addEventListener('resize',()=>{if(mode&&mode!=='circular-product')render()},{passive:true});

  window.RestaurantNativeProductEngines=Object.freeze({
    activate,deactivate,refresh:()=>mode&&render(),
    state:()=>({active:!!mode,mode,activeIndex:index,count:items().length,progress}),
    next:()=>step(1),prev:()=>step(-1),discover,openDetail
  });
  setTimeout(sync,0);
})();
