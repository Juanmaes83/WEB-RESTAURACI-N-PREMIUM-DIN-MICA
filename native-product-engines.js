/* MOTION 16 — NATIVE PRODUCT ENGINES

   Native siblings of the approved full-page Experiences. The Experiences stay
   untouched in Class 22. This runtime only owns the product-area presentation and
   reads the existing Project State.

   Two circular engines now coexist deliberately:
     · circular-product        → full baked 8-sector pizza grammar;
     · circular-radial-product → restored radial dish selector from the first native
                                 Circular Dish Rotator implementation.

   Nothing is replaced: Full Pizza and Radial are separate Studio choices.
*/
(() => {
  'use strict';

  const MODES=new Set(['circular-product','circular-radial-product','dish-stage-product','cinematic-rail-product']);
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
  const imageOf=d=>d?.depthCarousel?.asset||d?.image||'';

  function ensureStyles(){
    if(!$('link[data-native-product-engines-styles]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='styles-native-product-engines.css';l.dataset.nativeProductEnginesStyles='1';document.head.appendChild(l);
    }
  }

  /* The restored radial engine keeps its original visual grammar without touching the
     Full Pizza CSS. It is deliberately isolated under .npe-circular-radial-product. */
  function ensureRadialStyles(){
    if($('style[data-circular-radial-restored]'))return;
    const s=document.createElement('style');s.dataset.circularRadialRestored='1';
    s.textContent=`
.npe-circular-radial-product .npe-copy{left:auto;right:clamp(28px,5vw,74px);bottom:clamp(90px,10vh,126px);width:min(390px,32vw)}
.npe-circular-radial-product .npe-world{background:radial-gradient(circle at 31% 44%,color-mix(in srgb,var(--npe-accent) 15%,transparent),transparent 31%),linear-gradient(145deg,color-mix(in srgb,var(--npe-world) 92%,#1a1713),#050504 72%)}
.npe-circular{position:absolute;left:clamp(30px,7vw,112px);top:50%;width:min(58vw,690px);aspect-ratio:1;transform:translateY(-50%);touch-action:pan-y;outline:none;user-select:none;-webkit-user-select:none}
.npe-circular:focus-visible{filter:drop-shadow(0 0 18px color-mix(in srgb,var(--npe-accent) 40%,transparent))}
.npe-circular-halo{position:absolute;inset:12%;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--npe-accent) 14%,transparent),transparent 62%);filter:blur(18px)}
.npe-circular-ring{position:absolute;inset:8%;border-radius:50%;border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 0 90px rgba(0,0,0,.35)}
.npe-circular-ring:before,.npe-circular-ring:after{content:"";position:absolute;border-radius:50%;inset:9%;border:1px dashed rgba(255,255,255,.08);pointer-events:none}
.npe-circular-ring:after{inset:22%;border-style:solid;border-color:color-mix(in srgb,var(--npe-accent) 26%,transparent)}
.npe-circular-label{--npe-x:0%;--npe-y:0%;--npe-scale:1;--npe-opacity:1;position:absolute;left:calc(50% + var(--npe-x));top:calc(50% + var(--npe-y));width:112px;min-height:58px;padding:7px 8px;border:0;background:transparent;text-align:center;cursor:pointer;transform:translate(-50%,-50%) scale(var(--npe-scale));opacity:var(--npe-opacity);transition:opacity .18s ease,color .18s ease;transform-origin:center}
.npe-circular-label span{display:block;margin-bottom:4px;font-size:9px;letter-spacing:.18em;color:rgba(255,255,255,.45)}
.npe-circular-label strong{display:block;font-size:11px;font-weight:500;line-height:1.12;letter-spacing:.04em}
.npe-circular-label[data-active="1"]{color:var(--npe-accent)}
.npe-circular-label[data-active="1"] strong{font-size:12px}
.npe-circular-center{position:absolute;left:50%;top:50%;width:43%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.09),rgba(0,0,0,.28) 64%,rgba(0,0,0,.66));border:1px solid rgba(255,255,255,.12);box-shadow:0 36px 80px rgba(0,0,0,.48)}
.npe-circular-image-wrap{position:absolute;inset:10%;display:grid;place-items:center;border-radius:50%;overflow:hidden}
.npe-circular-image-wrap:after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 45px rgba(0,0,0,.26);pointer-events:none}
.npe-circular-image-wrap img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 24px 28px rgba(0,0,0,.45));transition:opacity .25s ease,transform .55s cubic-bezier(.2,.75,.2,1);pointer-events:none}
.npe-circular-index{position:absolute;bottom:7%;right:15%;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--npe-accent);color:#0a0a09;font-size:11px;font-weight:700;box-shadow:0 8px 24px color-mix(in srgb,var(--npe-accent) 24%,transparent)}
.npe-circular-marker{position:absolute;left:50%;top:1%;width:2px;height:15%;background:linear-gradient(var(--npe-accent),transparent);transform:translateX(-50%);filter:drop-shadow(0 0 8px var(--npe-accent))}
.npe-circular-marker i{position:absolute;left:50%;top:0;width:10px;height:10px;border-radius:50%;background:var(--npe-accent);transform:translate(-50%,-35%)}
@media(max-width:980px){.npe-circular-radial-product .npe-copy{left:24px;right:24px;bottom:92px;width:auto}.npe-circular{left:50%;top:34%;width:min(78vw,590px);transform:translate(-50%,-50%)}}
@media(max-width:620px){.npe-circular{top:31%;width:min(92vw,520px)}.npe-circular-label{width:88px;min-height:50px;padding:4px}.npe-circular-label strong{font-size:9px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.npe-circular-label span{font-size:8px}.npe-circular-center{width:46%}.npe-circular-radial-product .npe-copy{left:20px;right:20px;bottom:84px}}
`;
    document.head.appendChild(s);
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
    const kicker=kind==='circular-product'?'PIZZA SELECTION · FULL PIZZA ENGINE':kind==='circular-radial-product'?'SIGNATURE DISH · RADIAL ROTATOR':kind==='dish-stage-product'?'SIGNATURE DISH · CINEMATIC STAGE':'MENU STORY · CINEMATIC RAIL';
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

  /* FULL PIZZA — current engine, preserved as-is. */
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
    renderCircular();
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
      const next=angle(e),d=delta(next,drag.angle);drag.angle=next;progress-=d/45;drag.progress=progress;renderCircular();
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

  /* RESTORED RADIAL — the original native Circular Dish Rotator implementation. */
  function mountCircularRadial(){
    ensureRadialStyles();
    const d=item();
    host.className='npe-stage npe-circular-radial-product';
    host.innerHTML=`<div class="npe-world"></div><div class="npe-grain"></div>
      <div class="npe-circular" tabindex="0" aria-label="Selector radial de platos. Arrastra horizontalmente o usa las flechas.">
        <div class="npe-circular-halo" aria-hidden="true"></div>
        <div class="npe-circular-ring" data-npe-radial-ring></div>
        <div class="npe-circular-center">
          <div class="npe-circular-image-wrap"><img data-npe-radial-hero alt=""></div>
          <span class="npe-circular-index" data-npe-radial-index></span>
        </div>
        <div class="npe-circular-marker" aria-hidden="true"><i></i></div>
      </div>
      ${commonCopy(d,'circular-radial-product')}`;
    const ring=$('[data-npe-radial-ring]',host);
    if(ring)ring.innerHTML=items().map((p,i)=>`<button type="button" class="npe-circular-label" data-npe-radial-go="${i}" aria-label="Seleccionar ${esc(p.name||'Plato')}"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(p.name||'')}</strong></button>`).join('');
    ring?.addEventListener('click',e=>{
      const b=e.target.closest('[data-npe-radial-go]');if(!b)return;
      const i=Number(b.dataset.npeRadialGo);if(!Number.isFinite(i))return;
      if(i===index&&b.dataset.active==='1')openDetail();else animateRadialTo(i);
    });
    bindCommon();bindRadial();renderCircularRadial();
  }

  function radialDistance(i){
    const n=items().length;if(!n)return 0;
    let d=i-mod(progress,n);if(d>n/2)d-=n;if(d<-n/2)d+=n;return d;
  }

  function renderCircularRadial(){
    const list=items(),n=list.length;if(!n)return;
    index=mod(Math.round(progress),n);const d=list[index];
    host.style.setProperty('--npe-accent',accentOf(d));host.style.setProperty('--npe-world',worldOf(d));
    const hero=$('[data-npe-radial-hero]',host);if(hero){const src=imageOf(d);if(hero.getAttribute('src')!==src)hero.src=src;hero.alt=d.name||''}
    const badge=$('[data-npe-radial-index]',host);if(badge)badge.textContent=String(index+1).padStart(2,'0');
    $$('.npe-circular-label',host).forEach((el,i)=>{
      const dist=radialDistance(i),angle=dist*(360/n)-90,rad=angle*Math.PI/180,r=innerWidth<760?38:41;
      const x=Math.cos(rad)*r,y=Math.sin(rad)*r,ad=Math.abs(dist),focus=clamp(1-ad/Math.max(2.8,n/2),0,1);
      el.style.setProperty('--npe-x',`${x.toFixed(3)}%`);el.style.setProperty('--npe-y',`${y.toFixed(3)}%`);
      el.style.setProperty('--npe-scale',(0.72+focus*.32).toFixed(3));el.style.setProperty('--npe-opacity',(0.25+focus*.75).toFixed(3));
      el.dataset.active=ad<.45?'1':'0';el.tabIndex=ad<.45?0:-1;
    });
    renderCopy(d);
  }

  function animateRadialTo(target,duration=560){
    cancelAnim();const n=items().length;if(!n)return Promise.resolve();
    const normalized=mod(Number(target)||0,n);let delta=normalized-mod(progress,n);if(delta>n/2)delta-=n;if(delta<-n/2)delta+=n;
    const finalValue=progress+delta;
    if(reduced.matches||duration<=0){progress=finalValue;renderCircularRadial();return Promise.resolve()}
    const start=progress,t0=performance.now();
    return new Promise(resolve=>{
      const frame=now=>{const p=clamp((now-t0)/duration,0,1),ease=1-Math.pow(1-p,4);progress=start+(finalValue-start)*ease;renderCircularRadial();if(p<1)anim=requestAnimationFrame(frame);else{anim=null;progress=finalValue;renderCircularRadial();resolve()}};
      anim=requestAnimationFrame(frame);
    });
  }

  function bindRadial(){
    const surface=$('.npe-circular',host);if(!surface)return;
    surface.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;cancelAnim();drag={id:e.pointerId,x:e.clientX,progress};surface.setPointerCapture?.(e.pointerId);host.dataset.dragging='true'});
    surface.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>3)e.preventDefault();progress=drag.progress-dx/(innerWidth<620?170:240);renderCircularRadial()},{passive:false});
    const end=e=>{if(!drag||drag.id!==e.pointerId)return;surface.releasePointerCapture?.(e.pointerId);drag=null;delete host.dataset.dragging;animateRadialTo(Math.round(progress),420)};
    surface.addEventListener('pointerup',end);surface.addEventListener('pointercancel',end);
    surface.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}else if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail()}});
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
  function render(){if(mode==='circular-product')renderCircular();else if(mode==='circular-radial-product')renderCircularRadial();else if(mode==='dish-stage-product')renderDishStage();else if(mode==='cinematic-rail-product')renderRail()}
  function step(delta){if(mode==='circular-product')return goTo(Math.round(progress)+delta);if(mode==='circular-radial-product')return animateRadialTo(Math.round(progress)+delta);setIndex(index+delta)}
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
    if(mode!=='circular-product'){
      try{window.RestaurantOrbit?.setProgress?.(index)}catch{}
      if(window.RestaurantProductDetail?.open)return window.RestaurantProductDetail.open(d.id,{via:'button'})!==false;
      window.dispatchEvent(new CustomEvent('restaurant:class6-open-dish',{detail:{id:d.id}}));
      return true;
    }
    detail=$('[data-npe-pizza-dialog]',host);if(!detail)return false;
    $('[data-npe-dialog-meta]',detail).textContent=d.meta||'';$('[data-npe-dialog-title]',detail).textContent=d.name||'';$('[data-npe-dialog-ingredients]',detail).textContent=d.ingredients||d.short||'';detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');$('[data-npe-dialog-close]',detail)?.focus();return true;
  }
  function closeCircularDetail(){if(!detail)return;detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true')}

  function activate(next){
    if(!MODES.has(next))return deactivate();
    const h=ensureHost();if(!h)return;
    mode=next;index=0;progress=0;detail=null;h.hidden=false;h.inert=false;
    $('.orbital-section')?.classList.add('npe-active');$('.orbital-section')?.setAttribute('data-native-engine',mode);root.dataset.nativeProductEngine=mode;
    if(mode==='circular-product')mountCircular();else if(mode==='circular-radial-product')mountCircularRadial();else if(mode==='dish-stage-product')mountDishStage();else mountRail();
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