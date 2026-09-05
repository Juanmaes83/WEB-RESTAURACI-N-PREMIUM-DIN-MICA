/* CLASS 08 · PROJECT 01 — CINEMATIC DEPTH CAROUSEL · VISUAL DIRECTION V2
   Additive Motion Engine preset. Selected from Studio → Motion → "Depth Carousel".

   Architecture (unchanged from V1, proven by Class 07 Editorial Flow):
     · The Orbital Engine (app-v4 / class4-runtime-guard) remains the AUTHORITATIVE
       dish state. #dish-counter is the single source of truth for the active index.
     · This engine owns only the VISIBLE choreography; #orbit-stage is hidden by
       styles-v8.css while the preset is active.
     · Navigation is committed back by clicking the real base dish, so copy, detail,
       the Class 06 product layer and Studio keep working untouched.

   V2 raises presentation, not architecture:
     · FREE OBJECTS — dish.depthCarousel.asset (transparent WebP). No card, no
       artificial circle, no box-shadow container: drop-shadow on the real silhouette.
     · SCENE BACKGROUND ENGINE — one full-section colour world per dish, crossfaded
       by the fractional drag position, not by activeIndex.
     · LETTERING AS ARCHITECTURE — one giant word per dish on its own parallax rail,
       occluded by the plates.
     · ASYMMETRIC TRACK with CSS perspective, per-slot rotateX/rotateZ, deliberate
       cropping at the viewport edges and scale-driven z-order, so plates cross.
     · Every layer moves at its own rate and reacts continuously to the gesture.
*/
(() => {
  'use strict';
  if(!window.gsap)return;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const shell=$('.orbit-shell'), baseStage=$('#orbit-stage'), copy=$('.dish-copy'), controls=$('.orbit-controls');
  const section=$('.orbital-section');
  if(!shell||!baseStage||!copy||!section)return;

  const MODE='depth-carousel';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const FALLBACK=[
    {accent:'#ff6a3c',backgroundColor:'#1e0a05'},{accent:'#4f8dff',backgroundColor:'#050f22'},
    {accent:'#b9e24d',backgroundColor:'#101c07'},{accent:'#34d3c6',backgroundColor:'#041d1d'},
    {accent:'#ef5b7e',backgroundColor:'#1d0611'},{accent:'#ffc23d',backgroundColor:'#201202'}
  ];

  /* ---------------------------------------------------------------------------
     DEPTH TRACK — asymmetric on purpose.
     x/y are percentages of the shell, s scale, o opacity, b blur, rz rotateZ,
     rx rotateX (a shared CSS perspective lives on .dc-plates).
     Left and right are NOT mirrored: -2 rides high-left, +2 drops low-right and
     leaves the frame. Slot spacing decreases outwards so plates travel different
     distances per step, which is what reads as parallax between objects.
  --------------------------------------------------------------------------- */
  const TRACK_DESKTOP={
    '-3':{x:-12,y:12,s:.30,o:0,  b:3.2,rz:-17,rx:47},
    '-2':{x: 14,y:17,s:.58,o:.50,b:2.1,rz:-11,rx:42},
    '-1':{x: 32,y:33,s:.82,o:.95,b:.7, rz: -6,rx:29},
    '0' :{x: 53,y:55,s:1.30,o:1, b:0,  rz:  0,rx:20},
    '1' :{x: 76,y:25,s:.77,o:.95,b:.8, rz: 10,rx:35},
    '2' :{x: 93,y:70,s:.60,o:.54,b:1.8,rz: 16,rx:40},
    '3' :{x:116,y:78,s:.38,o:0,  b:3.2,rz: 21,rx:46}
  };
  const TRACK_MOBILE={
    '-3':{x:-26,y:14,s:.34,o:0,  b:3.0,rz:-18,rx:44},
    '-2':{x: -2,y:18,s:.56,o:.46,b:2.1,rz:-13,rx:40},
    '-1':{x: 16,y:31,s:.82,o:.90,b:.8, rz: -7,rx:28},
    '0' :{x: 52,y:58,s:1.30,o:1, b:0,  rz:  0,rx:19},
    '1' :{x: 87,y:23,s:.77,o:.90,b:.9, rz: 11,rx:33},
    '2' :{x:106,y:66,s:.58,o:.44,b:1.9,rz: 17,rx:38},
    '3' :{x:130,y:74,s:.36,o:0,  b:3.0,rz: 22,rx:44}
  };

  /* Layer rates. 1.00 is the plate rail; everything else lags behind it. */
  const RATE={word:.55,backdrop:.20};

  let scene=null,platesHost=null,wordsHost=null,backdrop=null,copyEl=null,priceEl=null,ingEl=null,dotsEl=null,eyebrowEl=null;
  let position=0,activeIndex=0,snapTween=null,breathTween=null;
  let dragging=false,pointerId=null,startX=0,startPos=0,lastX=0,lastT=0,velocity=0,moved=false;
  let lastWheel=0,internalPass=false,booted=false,meta=new Map();
  let baseSyncTarget=null,baseSyncTimer=null;

  const isDepth=()=>root.dataset.orbitalMotion===MODE;
  const detailOpen=()=>root.dataset.dishDetail==='open'||document.body.classList.contains('detail-open');
  const isMobile=()=>innerWidth<820;
  const baseDishes=()=>$$('.orbit-dish',baseStage);
  const count=()=>baseDishes().length;
  const normalize=(n,total=count())=>total?((n%total)+total)%total:0;
  const counterIndex=()=>{const n=parseInt($('#dish-counter')?.textContent||'',10);return Number.isFinite(n)?Math.max(0,n-1):0};
  const plates=()=>platesHost?$$('.dc-plate',platesHost):[];

  /* ---------- colour helpers (continuous accent interpolation) ---------- */
  const hex2rgb=h=>{const v=String(h||'').replace('#','');const n=v.length===3?v.split('').map(c=>c+c).join(''):v;const i=parseInt(n,16);return Number.isFinite(i)?[i>>16&255,i>>8&255,i&255]:[216,255,79]};
  const rgb2css=c=>`rgb(${c.map(v=>Math.round(v)).join(',')})`;
  const mixRgb=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const lighten=(h,t)=>rgb2css(mixRgb(hex2rgb(h),[255,255,255],t));

  /* ---------- data: the real dish model, extended, never duplicated ---------- */
  const firstWord=name=>String(name||'').trim().split(/[\s/·—-]+/).filter(Boolean)[0]||'DISH';
  function defaultMeta(dish,i){
    const fb=FALLBACK[i%FALLBACK.length];
    return {
      asset:'',                                   /* falls back to dish.image */
      word:firstWord(dish?.name),
      accent:dish?.editorialFlow?.color||fb.accent,
      backgroundColor:fb.backgroundColor,
      backgroundGradient:'',
      background:'',
      foregroundDecor:'',
      backgroundDecor:''
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
    const i=normalize(index,list.length||1),d=list[i]||{};
    return {...defaultMeta(d,i),...(d.depthCarousel||{}),dish:d};
  }
  /* The scene background is derived from the dish colour world unless the project
     supplies an explicit gradient or image. */
  function backgroundFor(info){
    if(info.background)return `url("${info.background}") center/cover no-repeat`;
    if(info.backgroundGradient)return info.backgroundGradient;
    const a=hex2rgb(info.accent),base=info.backgroundColor||'#0a0a08';
    const glow=(t,alpha)=>`rgba(${a.map(v=>Math.round(v*t)).join(',')},${alpha})`;
    return [
      `radial-gradient(ellipse 82% 66% at 56% 24%, ${glow(1,.46)} 0%, transparent 64%)`,
      `radial-gradient(ellipse 66% 58% at 10% 86%, ${glow(.66,.40)} 0%, transparent 68%)`,
      `radial-gradient(ellipse 92% 84% at 90% 94%, ${glow(.46,.30)} 0%, transparent 72%)`,
      `linear-gradient(168deg, ${base} 0%, #06060a 72%)`
    ].join(',');
  }

  /* ---------- studio + styles ---------- */
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

  /* ---------- scene construction ---------- */
  function ensureScene(){
    if(!backdrop?.isConnected){
      backdrop=document.createElement('div');
      backdrop.className='dc-backdrop';backdrop.setAttribute('aria-hidden','true');
      section.insertBefore(backdrop,section.firstChild);
    }
    if(!scene?.isConnected){
      scene=document.createElement('div');scene.className='dc-scene';scene.setAttribute('aria-hidden','true');
      wordsHost=document.createElement('div');wordsHost.className='dc-words';
      platesHost=document.createElement('div');platesHost.className='dc-plates';
      scene.append(wordsHost,platesHost);
      shell.appendChild(scene);
    }
    eyebrowEl=$('.dc-eyebrow',section);
    if(!eyebrowEl){
      eyebrowEl=document.createElement('p');
      eyebrowEl.className='dc-eyebrow';
      eyebrowEl.innerHTML='<span>Signature collection</span><span class="dc-eyebrow-hint">Arrastra para explorar</span>';
      section.insertBefore(eyebrowEl,shell);
    }

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

    platesHost.innerHTML='';wordsHost.innerHTML='';backdrop.innerHTML='';
    items.forEach((base,i)=>{
      const info=dishFor(i);
      const src=info.asset||$('img',base)?.getAttribute('src')||info.dish?.image||'';
      if(!src)return;

      const btn=document.createElement('button');
      btn.type='button';btn.className=`dc-plate ${info.asset?'is-free':'is-framed'}`;btn.tabIndex=-1;
      btn.dataset.id=base.dataset.id||'';btn.dataset.index=String(i);
      const img=document.createElement('img');
      img.src=src;img.alt='';img.decoding='async';img.draggable=false;
      /* If the free-object asset fails, fall back to the framed orbital image
         rather than leaving a hole in the scene. */
      img.onerror=()=>{const f=$('img',base)?.getAttribute('src');if(f&&img.src!==f){img.src=f;btn.className='dc-plate is-framed'}};
      btn.appendChild(img);
      platesHost.appendChild(btn);

      const word=document.createElement('div');
      word.className='dc-word';word.dataset.index=String(i);
      word.textContent=info.word;
      /* Each word keeps its OWN dish colour. Using the globally interpolated accent
         would make an outgoing word drift towards the incoming dish's hue mid-drag. */
      word.style.color=lighten(info.accent,.46);
      wordsHost.appendChild(word);

      const bg=document.createElement('div');
      bg.className='dc-bg';bg.dataset.index=String(i);
      bg.style.background=backgroundFor(info);
      backdrop.appendChild(bg);
    });
    const veil=document.createElement('div');veil.className='dc-vignette';backdrop.appendChild(veil);

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
    renderAt(position);commitText(activeIndex);
  }

  /* ---------- track sampling ---------- */
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  function sampleTrack(distance){
    const table=isMobile()?TRACK_MOBILE:TRACK_DESKTOP;
    const d=clamp(distance,-3,3);
    const lo=Math.floor(d),hi=Math.ceil(d),t=d-lo;
    const A=table[String(lo)],B=table[String(hi)]||A;
    const out={};
    for(const k of ['x','y','s','o','b','rz','rx'])out[k]=lerp(A[k],B[k],t);
    return out;
  }
  function wrapped(i,pos,total){let d=i-pos;while(d>total/2)d-=total;while(d<-total/2)d+=total;return d}

  /* ---------------------------------------------------------------------------
     THE FRAME. Everything below is driven by the continuous position, never by
     Math.round(position): at 2.37 the whole scene sits 37% of the way from 2 to 3.
  --------------------------------------------------------------------------- */
  function renderAt(pos){
    const list=plates(),n=list.length;
    if(!n)return;
    const W=shell.clientWidth,H=shell.clientHeight,mobile=isMobile();
    const T=mobile?TRACK_MOBILE:TRACK_DESKTOP;
    const stepPx=(T['1'].x-T['0'].x)/100*W;

    list.forEach((plate,i)=>{
      const d=wrapped(i,pos,n),slot=sampleTrack(d);
      /* fade the wrap seam: at |d| ~ 3 a plate teleports to the far side, so it
         must already be invisible when it does */
      const seam=clamp((2.85-Math.abs(d))/.45,0,1);
      const o=slot.o*seam;
      const visible=o>.02;
      /* secondary arc: mid-transition paths curve, and the curvature differs per
         slot, so no two objects trace the same line */
      const arc=Math.sin(clamp(d,-3,3)*Math.PI/1.6)*(mobile?7:16);
      const shadow=visible?` drop-shadow(0 ${(16+slot.s*26).toFixed(0)}px ${(20+slot.s*24).toFixed(0)}px rgba(0,0,0,${(0.30+slot.s*0.22).toFixed(2)}))`:'';
      gsap.set(plate,{
        xPercent:-50,yPercent:-50,
        x:slot.x/100*W, y:slot.y/100*H+arc,
        scale:slot.s, rotation:slot.rz, rotationX:slot.rx,
        opacity:o,
        filter:visible?`blur(${slot.b.toFixed(2)}px) brightness(${(0.56+(1-clamp(Math.abs(d)/2.4,0,1))*0.50).toFixed(3)})${shadow}`:'none',
        /* z-order follows apparent size, not slot index: as an outgoing plate
           shrinks past an incoming one they swap depth and physically cross */
        zIndex:Math.round(slot.s*160+slot.y*0.2),
        pointerEvents:o>.35?'auto':'none'
      });
      plate.classList.toggle('is-hero',Math.abs(d)<.42);

      const word=wordsHost.children[i];
      if(word){
        /* Two overlapping giant words read as letter soup. The ramp holds the
           current word at full strength until |d| 0.28 and drops it to nothing by
           0.62, so at any moment one word dominates and the other is almost gone. */
        /* Two overlapping giant words read as letter soup. Only one word is ever
           on screen: it holds until |d| 0.38 and is gone by 0.5, where the next one
           takes over. While it leaves it also lifts and swells, so it reads as the
           word rushing past the camera rather than dissolving. */
        const wo=clamp((.5-Math.abs(d))/.12,0,1);
        gsap.set(word,{xPercent:-50,yPercent:-50,
          x:-d*stepPx*RATE.word, y:-Math.abs(d)*(mobile?26:44),
          opacity:wo*(mobile?.36:.32), scale:1+Math.abs(d)*.10});
      }
      const bg=backdrop.children[i];
      if(bg)gsap.set(bg,{opacity:Math.pow(clamp(1-Math.abs(d),0,1),.75),x:-d*stepPx*RATE.backdrop,scale:1+Math.abs(d)*.04});
    });

    /* Continuous accent. It must interpolate between the slot BELOW and the slot
       ABOVE the position: pairing on Math.round() flips the pair at .5 and snaps
       the colour back to where it came from. */
    const lo=Math.floor(pos),t=pos-lo,ease=t*t*(3-2*t);
    root.style.setProperty('--dc-accent',
      rgb2css(mixRgb(hex2rgb(dishFor(lo).accent),hex2rgb(dishFor(lo+1).accent),ease)));

    /* the copy dips while the scene is in flight, so the base engine's text swap
       never happens in plain sight */
    const dip=1-Math.min(.62,Math.abs(pos-Math.round(pos))*1.35);
    gsap.set(copy,{opacity:dip});
    if(eyebrowEl)gsap.set(eyebrowEl,{opacity:.55+dip*.45});
  }

  /* ---------- text that belongs to this engine ---------- */
  function commitText(index){
    const info=dishFor(index),d=info.dish||{};
    if(priceEl)priceEl.textContent=d.price||'';
    if(ingEl)ingEl.textContent=d.ingredients||d.meta||'';
    if(dotsEl)$$('.dc-dot',dotsEl).forEach((dot,i)=>dot.setAttribute('aria-current',String(i===normalize(index))));
  }

  /* ---------- idle physicality ---------- */
  function heroImg(){const h=plates()[normalize(activeIndex)];return h?$('img',h):null}
  function stopBreath(){breathTween?.kill?.();breathTween=null;const img=heroImg();if(img)gsap.set(img,{y:0,scale:1})}
  function startBreath(){
    stopBreath();
    if(!isDepth()||reduced.matches||detailOpen()||dragging)return;
    const img=heroImg();
    if(!img)return;
    breathTween=gsap.to(img,{y:-9,scale:1.014,duration:2.8,ease:'sine.inOut',yoyo:true,repeat:-1});
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
  /* The base dish is hidden behind our plate. Park it on the hero's real geometry so
     the GSAP Flip transition into the dish detail starts where the user sees it. */
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
    const dur=reduced.matches?.01:(duration??Math.min(1.15,.46+dist*.30));
    const landed=normalize(Math.round(target));
    snapTween=gsap.to(state,{
      p:target,duration:dur,ease:reduced.matches?'none':'power3.out',
      onUpdate(){position=state.p;renderAt(position);trackActive()},
      onComplete(){
        position=target;renderAt(position);setActive(landed);commitText(counterIndex());
        root.dataset.orbitalChoreography='depth-carousel-v2';startBreath();
      }
    });
    syncBaseTo(landed);
  }
  /* activeIndex tracks the VISUAL hero (which plate is under the camera).
     It deliberately does NOT drive the text: price and ingredients follow the base
     engine's counter instead, so they can never disagree with the title and
     description that the base engine writes. */
  function setActive(index){
    const next=normalize(index);
    if(next===activeIndex)return;
    activeIndex=next;
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
  const dragUnit=()=>shell.clientWidth*(isMobile()?.34:.26);
  function onDown(e){
    if(!isDepth()||detailOpen()||!count())return;
    if(e.target.closest('.dc-dot,#next-dish,#prev-dish,#explore-dish'))return;
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=lastX=e.clientX;startPos=position;lastT=e.timeStamp||performance.now();velocity=0;
    snapTween?.kill?.();stopBreath();
    root.dataset.depthDrag='1';
    try{shell.setPointerCapture?.(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    const now=e.timeStamp||performance.now(),dt=Math.max(1,now-lastT);
    velocity=velocity*.6+((e.clientX-lastX)/dt)*.4;
    lastX=e.clientX;lastT=now;
    if(Math.abs(e.clientX-startX)>7)moved=true;
    position=startPos-(e.clientX-startX)/dragUnit();
    renderAt(position);trackActive();
  }
  function onUp(e){
    if(!dragging||(pointerId!==null&&e.pointerId!==pointerId))return;
    dragging=false;pointerId=null;
    delete root.dataset.depthDrag;
    try{shell.releasePointerCapture?.(e.pointerId)}catch{}
    if(!moved){snapTo(Math.round(position));return}
    /* project the flick: 180ms of travel at the smoothed release velocity */
    const offset=clamp(-(velocity*180)/dragUnit(),-2,2);
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
  document.addEventListener('pointercancel',e=>{if(!dragging)return;e.stopImmediatePropagation();dragging=false;pointerId=null;delete root.dataset.depthDrag;snapTo(Math.round(position))},true);

  /* Runs before the Class 06 hero bridge (document capture precedes .orbit-shell
     capture), so a drag release can never be mistaken for an "open the dish" click. */
  document.addEventListener('click',e=>{
    if(!isDepth()||internalPass||detailOpen())return;
    const dot=e.target.closest('.dc-dot');
    if(dot){e.preventDefault();e.stopImmediatePropagation();goTo(Number(dot.dataset.index));return}
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
      scene.hidden=false;backdrop.hidden=false;
      activeIndex=counterIndex();position=activeIndex;
      renderAt(position);commitText(activeIndex);startBreath();
      root.dataset.depthCarousel='ready';
      root.dataset.orbitalChoreography='depth-carousel-v2';
    }else{
      if(scene)scene.hidden=true;
      if(backdrop)backdrop.hidden=true;
      snapTween?.kill?.();stopBreath();dragging=false;
      gsap.set(copy,{opacity:1});
      if(eyebrowEl)gsap.set(eyebrowEl,{opacity:1});
      delete root.dataset.depthCarousel;
      root.style.removeProperty('--dc-accent');
    }
  }

  new MutationObserver(()=>{
    if(!isDepth())return;
    const idx=counterIndex();
    /* Mirror the base engine's index for our own text on every change, including the
       intermediate ones it sweeps through: title/description (base) and
       price/ingredients/indicators (ours) must always describe the same dish. */
    commitText(idx);
    if(baseSyncTarget!==null){
      if(idx===baseSyncTarget){baseSyncTarget=null;clearTimeout(baseSyncTimer)}
      return;
    }
    if(dragging||snapTween?.isActive())return;
    if(idx!==activeIndex)goTo(idx);
  }).observe($('#dish-counter')||copy,{subtree:true,childList:true,characterData:true});

  new MutationObserver(()=>{
    /* app-v4 moves the real dish node into #detail-visual while the detail is open.
       Rebuilding then would leave the scene one plate short. */
    if(!isDepth()||detailOpen())return;
    setTimeout(()=>{if(isDepth()&&!detailOpen())rebuild()},40);
  }).observe(baseStage,{childList:true});

  window.addEventListener('restaurant:motion-change',()=>setTimeout(activate,0));
  window.addEventListener('restaurant:dish-detail-open',()=>{dragging=false;snapTween?.kill?.();stopBreath()});
  window.addEventListener('restaurant:dish-detail-close',()=>setTimeout(()=>{if(isDepth()){rebuild();activate()}},260));
  reduced.addEventListener?.('change',activate);
  addEventListener('resize',()=>{if(isDepth())renderAt(position)});

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
    setPosition(p){snapTween?.kill?.();position=p;renderAt(p);trackActive()},
    state:()=>({position,activeIndex,plates:plates().length,mode:root.dataset.orbitalMotion,
      freeObjects:plates().filter(p=>p.classList.contains('is-free')).length})
  };
})();
