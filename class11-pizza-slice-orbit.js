/* CLASS 11 · PROJECT 07 — PIZZA SLICE ORBIT / HERO SELECTOR

   THE FRAME STAYS. THE PRODUCTS MOVE. EVERY PRODUCT FITS THE SAME FRAME.

   Eight independent slices travel a radial orbit. One station is fixed in the
   composition and never moves: the active slice arrives into it, normalized by its
   own registration data, and fills the same outline every time.

   This is NOT the assembled pizza — the wedges radiate outward from a hollow hub with
   their own scales, so they read as eight separate products in orbit rather than a
   pie. The complete pizza image belongs to Project 06 and is never moved here.

   ONE STATE:
     rotationProgress — 1.0 = one slice, 8.0 = one full revolution
   EVERYTHING derives from it:
     rotationProgress → continuousDistance(i) → angle → position → heroProximity
                      → scale / opacity / z-order / rotation → activeIndex

   Step, drag and spin all write that one scalar. There is no separate drag progress,
   spin progress or selected index that could disagree with what is on screen.

   Why its own engine rather than RestaurantOrbit: the base engine's collection is the
   six-dish model with real dish records. These are eight pizza slices with no dish
   data, and pushing them through it would mean inventing dishes. The mission forbids
   inventing product data, so this owns a small rotary engine instead — with one
   progress, one derived index and one interaction path — and touches no other preset.
*/
(() => {
  'use strict';
  const MODE='pizza-slice-orbit';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const MANIFEST_URL='assets/pizza-motion/slices-manifest.json';

  /* Geometry direction. Tuned by looking, then measured by the suite. */
  /* rx/ry are the hub's diameters as a fraction of the stage; hubY is where the hub's
     centre sits down the stage; heroLen is the on-screen length of a slice at the
     station. The ring is wide and shallow so it reads as an orbit in perspective, and
     the hub sits low so the hero rises INTO the frame — a hub at mid-height sends the
     hero straight out of the top. */
  const GEO={
    desktop:{rx:.52,ry:.17,hubY:.70,heroLen:.56,heroScale:1.00,minScale:.21,
      curve:2.8,spread:.62,dim:.30,blur:2.6},
    /* A 390px viewport cannot take the desktop hub: at .80 the two neighbours ran off
       both edges. Tighter hub, slightly shorter hero, and previous/next sit whole. */
    mobile:{rx:.50,ry:.16,hubY:.58,heroLen:.43,heroScale:1.00,minScale:.20,
      curve:2.6,spread:.48,dim:.32,blur:1.9}
  };
  const DRAG_UNIT={desktop:190,mobile:130};   /* px of pointer travel per slice */
  const RELEASE=.42, FLING=.55;

  let root=document.documentElement,section=null,shell=null,copy=null;
  let stage=null,ring=null,station=null,glow=null,liveEl=null,nameEl=null,counterEl=null;
  let controls=null,spinBtn=null,prevBtn=null,nextBtn=null,hintEl=null;
  let slices=[],manifest=null,els=[];
  let progress=0,tween=null,spinning=false,ready=false,mounted=false;
  let dragging=false,pointerId=null,startX=0,startProgress=0,lastX=0,lastT=0,velocity=0,moved=false;
  let announced=-1;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  const isPizza=()=>root.dataset.orbitalMotion===MODE;
  const isMobile=()=>innerWidth<820;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const N=()=>slices.length;
  const geo=()=>isMobile()?GEO.mobile:GEO.desktop;

  /* ---------- the one derived index ---------- */
  const normalize=v=>{const n=N();return n?((v%n)+n)%n:0};
  const activeIndex=()=>normalize(Math.round(progress));
  /* signed shortest distance from slice i to the station, in slice units */
  function continuousDistance(i){
    const n=N();if(!n)return 0;
    let d=i-progress;
    while(d>n/2)d-=n;
    while(d<-n/2)d+=n;
    return d;
  }

  /* ---------- data ---------- */
  async function loadManifest(){
    if(manifest)return manifest;
    try{
      const res=await fetch(MANIFEST_URL,{cache:'force-cache'});
      if(!res.ok)throw new Error(`manifest ${res.status}`);
      manifest=await res.json();
      slices=(manifest.slices||[]).slice().sort((a,b)=>a.index-b.index);
    }catch(e){
      console.error('[pizza-slice-orbit] manifest unavailable',e);
      manifest=null;slices=[];
    }
    return manifest;
  }

  /* ---------- studio + styles ---------- */
  function injectStudioOption(){
    const select=$('#motion-orbital-style');
    if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const o=document.createElement('option');
      o.value=MODE;o.textContent='Pizza Slice Orbit';select.appendChild(o);
    }
    return true;
  }
  function ensureStyles(){
    if($('link[data-pizza-slice-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v11.css';l.dataset.pizzaSliceStyles='1';
    document.head.appendChild(l);
  }

  /* ---------- the fixed station ----------
     Drawn from the manifest's canonical wedge only: an SVG sector whose apex, radius
     and opening come from the audit, never from a slice image. It is a sibling of the
     ring, so no transform applied to the products can reach it. */
  function stationSvg(){
    const c=manifest?.canonical;
    if(!c)return '';
    const half=(c.halfAngleDeg||24)*Math.PI/180;
    const R=1000, dx=Math.sin(half)*R, dy=Math.cos(half)*R;
    /* apex at the origin, wedge opening upward, in a viewBox sized to the sector */
    /* The arc's midpoint sits R above the apex, higher than the corners at R·cos(half),
       so the viewBox has to be R tall or the crust edge is clipped. */
    const pad=26;
    const vbW=Math.ceil(dx*2+pad*2), vbH=Math.ceil(R+pad*2);
    const ax=vbW/2, ay=vbH-pad;
    const lx=ax-dx, rx=ax+dx, ty=ay-dy;
    return `<svg class="ps-station-svg" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="ps-edge" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="var(--ps-accent,#d8ff4f)" stop-opacity=".25"/>
          <stop offset=".55" stop-color="var(--ps-accent,#d8ff4f)" stop-opacity=".9"/>
          <stop offset="1" stop-color="var(--ps-accent,#d8ff4f)" stop-opacity=".55"/>
        </linearGradient>
        <radialGradient id="ps-halo" cx="50%" cy="100%" r="86%">
          <stop offset="0" stop-color="var(--ps-accent,#d8ff4f)" stop-opacity=".20"/>
          <stop offset="1" stop-color="var(--ps-accent,#d8ff4f)" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <path class="ps-station-halo" d="M ${ax} ${ay} L ${lx} ${ty} A ${R} ${R} 0 0 1 ${rx} ${ty} Z" fill="url(#ps-halo)"/>
      <path class="ps-station-edge" d="M ${ax} ${ay} L ${lx} ${ty} A ${R} ${R} 0 0 1 ${rx} ${ty} Z"
        fill="none" stroke="url(#ps-edge)" stroke-width="7" stroke-linejoin="round"/>
      <circle class="ps-station-pin" cx="${ax}" cy="${ay}" r="9" fill="var(--ps-accent,#d8ff4f)" opacity=".85"/>
    </svg>`;
  }

  /* ---------- build ---------- */
  function ensureStage(){
    section=section||$('.orbital-section');
    shell=shell||$('.orbit-shell');
    copy=copy||$('.dish-copy');
    controls=controls||$('.orbit-controls');
    if(!section||!shell)return false;

    if(!stage?.isConnected){
      stage=document.createElement('div');
      stage.className='ps-stage';stage.setAttribute('aria-hidden','false');
      glow=document.createElement('div');glow.className='ps-glow';
      /* the ring holds the products; the station is a sibling so it can never inherit
         a product transform — that is the whole illusion */
      ring=document.createElement('div');ring.className='ps-ring';
      station=document.createElement('div');station.className='ps-station';
      station.innerHTML=stationSvg();
      stage.append(glow,ring,station);
      shell.appendChild(stage);
    }else if(station&&!station.querySelector('svg')){
      station.innerHTML=stationSvg();
    }

    if(!$('.ps-head',section)){
      const head=document.createElement('div');head.className='ps-head';
      head.innerHTML='<p class="ps-eyebrow"><span>Pizza selection</span>'
        +'<span class="ps-hint">Arrastra para girar · o pulsa Descubrir</span></p>'
        +'<h3 class="ps-name" aria-live="off"></h3>'
        +'<p class="ps-counter"></p>';
      section.insertBefore(head,shell);
    }
    nameEl=$('.ps-name',section);counterEl=$('.ps-counter',section);hintEl=$('.ps-hint',section);

    if(!$('.ps-controls',section)){
      const bar=document.createElement('div');bar.className='ps-controls';
      bar.innerHTML='<button type="button" class="ps-btn ps-prev" aria-label="Porción anterior">←</button>'
        +'<button type="button" class="ps-btn ps-spin">Descubrir</button>'
        +'<button type="button" class="ps-btn ps-next" aria-label="Porción siguiente">→</button>';
      (controls||section).parentNode===null?section.appendChild(bar):section.insertBefore(bar,controls||null);
      if(controls)controls.insertAdjacentElement('beforebegin',bar);
    }
    prevBtn=$('.ps-prev',section);nextBtn=$('.ps-next',section);spinBtn=$('.ps-spin',section);

    if(!$('.ps-live',section)){
      liveEl=document.createElement('p');
      liveEl.className='ps-live';liveEl.setAttribute('role','status');
      liveEl.setAttribute('aria-live','polite');
      section.appendChild(liveEl);
    }
    liveEl=$('.ps-live',section);
    return true;
  }

  function buildSlices(){
    if(!ring)return;
    if(els.length===N()&&ring.children.length===N())return;
    ring.innerHTML='';els=[];
    slices.forEach((s,i)=>{
      const b=document.createElement('button');
      b.type='button';b.className='ps-slice';b.dataset.index=String(i);b.dataset.id=s.id;
      b.setAttribute('aria-label',`Seleccionar ${s.name}`);
      const img=document.createElement('img');
      img.className='ps-slice-img';
      img.src=s.runtimeAsset;img.alt=s.name;img.draggable=false;
      /* the hero and its immediate neighbours are worth the early bytes; the far side
         of the orbit can arrive when the browser has spare capacity */
      img.loading=i<=1||i>=N()-1?'eager':'lazy';
      img.decoding='async';
      /* registration lives in the manifest: scale and rotate about this slice's own
         apex, then move that apex onto the canonical one */
      const r=s.registration;
      img.style.transformOrigin=`${r.apex.x*100}% ${r.apex.y*100}%`;
      img.style.transform=`translate(${r.offsetX*100}%,${r.offsetY*100}%) `
        +`rotate(${r.rotationBias}deg) scale(${r.scale})`;
      b.appendChild(img);
      ring.appendChild(b);
      els.push(b);
    });
  }

  /* ---------- geometry: one scalar in, a whole composition out ---------- */
  /* Each slice's APEX rides an elliptical hub and the wedge radiates OUTWARD, so the
     middle of the composition stays hollow. Eight tips converging on one point is
     precisely how wedges stop being products and become a pizza — which is Project
     06's job, not this one. */
  function place(){
    if(!isPizza()||!ring||!N()||!manifest)return;
    const g=geo(),box={w:shell.clientWidth,h:shell.clientHeight};
    const mob=isMobile();
    const canon=manifest.canonical,canvas=manifest.canvas;

    /* The element is sized so that a hero at scale 1 renders the canonical wedge at
       the intended on-screen length; everything else follows from the scale curve. */
    const heroLen=g.heroLen*box.h;
    const size=heroLen/(canon.length/canvas.h);
    ring.style.setProperty('--ps-size',`${size.toFixed(1)}px`);
    ring.style.setProperty('--ps-apex-x',`${(canon.apex.x/canvas.w*100).toFixed(3)}%`);
    ring.style.setProperty('--ps-apex-y',`${(canon.apex.y/canvas.h*100).toFixed(3)}%`);

    const rxHub=g.rx*box.w*.5, ryHub=g.ry*box.h*.5;
    const cx=box.w/2, cy=box.h*g.hubY;
    const step=360/N();

    /* The station is placed from the SAME numbers as the hero: its apex on the hub at
       12 o'clock, its radius the hero length, its opening the canonical one. It is a
       sibling of the ring, so it is positioned — never transformed by a product. */
    if(station){
      const half=canon.halfAngleDeg*Math.PI/180;
      const w=2*Math.sin(half)*heroLen, h=heroLen;
      station.style.width=`${w.toFixed(1)}px`;
      station.style.height=`${h.toFixed(1)}px`;
      station.style.left=`${(cx-w/2).toFixed(1)}px`;
      station.style.top=`${(cy-ryHub-h).toFixed(1)}px`;
    }

    for(let i=0;i<N();i++){
      const el=els[i];if(!el)continue;
      const d=continuousDistance(i);
      const deg=d*step;                     /* 0° at the station */
      const rad=(deg-90)*Math.PI/180;       /* the station sits at 12 o'clock */
      const front=(Math.cos(deg*Math.PI/180)+1)/2;
      const depth=Math.pow(clamp(front,0,1),g.curve);
      const scale=g.minScale+depth*(g.heroScale-g.minScale);

      /* The hub opens up as a slice recedes: the far side of the orbit sits further
         out and smaller, which reads as depth instead of as a flat wheel. */
      const spread=1+(1-depth)*g.spread;
      const x=cx+Math.cos(rad)*rxHub*spread;
      const y=cy+Math.sin(rad)*ryHub*spread;

      el.style.setProperty('--ps-x',`${x.toFixed(2)}px`);
      el.style.setProperty('--ps-y',`${y.toFixed(2)}px`);
      el.style.setProperty('--ps-scale',scale.toFixed(4));
      el.style.setProperty('--ps-rot',`${deg.toFixed(2)}deg`);
      /* Tone falls off faster than position: the hero has to be the brightest thing on
         the stage, not merely the biggest, or the neighbours compete with it. */
      el.style.opacity=(g.dim+(1-g.dim)*Math.pow(clamp(front,0,1),2)).toFixed(3);
      el.style.filter=`blur(${((1-front)*g.blur).toFixed(2)}px) `
        +`brightness(${(.52+Math.pow(clamp(front,0,1),1.6)*.56).toFixed(3)}) `
        +`saturate(${(.62+front*.44).toFixed(3)})`;
      el.style.zIndex=String(Math.round(front*100));
      el.dataset.front=front.toFixed(3);
      el.dataset.hero=i===activeIndex()?'1':'0';
      el.tabIndex=i===activeIndex()?0:-1;
    }

    /* the accent light belongs to the station, and the station never moves */
    if(glow)glow.style.opacity=(.42+.30*(1-Math.min(1,Math.abs(progress-Math.round(progress))*2))).toFixed(3);
    root.dataset.pizzaProgress=(((progress%N())+N())%N()).toFixed(3);
  }

  /* ---------- copy: from the same index that paints the hero ---------- */
  function paintCopy(){
    const i=activeIndex(),s=slices[i];
    if(!s)return;
    if(nameEl)nameEl.textContent=s.name;
    if(counterEl)counterEl.textContent=`${String(i+1).padStart(2,'0')} / ${String(N()).padStart(2,'0')}`;
    els.forEach((el,k)=>el.setAttribute('aria-current',String(k===i)));
  }
  /* Announce only a committed selection: a live region that speaks every frame is
     unusable with a screen reader. */
  function announce(){
    const i=activeIndex(),s=slices[i];
    if(!s||!liveEl||announced===i)return;
    announced=i;
    liveEl.textContent=`Selected pizza: ${s.name}`;
  }

  function render(){place();paintCopy()}
  function setProgress(v){progress=v;render()}

  /* ---------- motion: every path writes the one scalar ---------- */
  function animateTo(target,duration,ease,onDone){
    tween?.kill?.();
    const s={p:progress};
    const dur=reduced.matches?Math.min(.18,duration):duration;
    tween=gsap.to(s,{p:target,duration:dur,ease:reduced.matches?'power2.out':ease,
      onUpdate(){setProgress(s.p)},
      onComplete(){setProgress(target);announce();onDone?.()}});
  }
  function step(dir){
    if(!isPizza()||spinning||!N())return;
    animateTo(Math.round(progress)+dir,reduced.matches?.18:.62,'power3.inOut');
  }
  function goTo(index){
    if(!isPizza()||spinning||!N())return;
    const n=N();let d=normalize(index)-normalize(Math.round(progress));
    while(d>n/2)d-=n;while(d<-n/2)d+=n;
    if(!d)return;
    animateTo(Math.round(progress)+d,reduced.matches?.18:.7,'power3.inOut');
  }
  function settle(){
    const target=Math.round(progress-velocity*(isMobile()?.020:.026));
    animateTo(target,reduced.matches?.14:.55,'power3.out');
  }

  /* ---------- discover ----------
     Real travel, not a short tween to the nearest index: several whole revolutions,
     accelerating, then a long deceleration that lands exactly on the chosen slice.
     The result is never decided separately from the motion — the spin sets the target
     progress and the active index is read back from that same scalar. */
  let rng=()=>Math.random();
  function spin(opts){
    if(!isPizza()||spinning||!N())return null;
    const n=N();
    const forced=opts&&Number.isInteger(opts.target)?normalize(opts.target):null;
    const target=forced!==null?forced:Math.floor(rng()*n)%n;
    const turns=opts&&Number.isFinite(opts.turns)?opts.turns
      :(reduced.matches?0:2+Math.floor(rng()*3));      /* 2–4 whole revolutions */
    /* travel forward only, so the direction reads as one continuous rotation */
    const base=Math.round(progress);
    let d=target-normalize(base);
    if(d<=0)d+=n;
    const finalProgress=base+d+turns*n;

    spinning=true;
    root.dataset.pizzaSpin='1';
    if(spinBtn)spinBtn.disabled=true;

    const done=()=>{
      spinning=false;delete root.dataset.pizzaSpin;
      if(spinBtn)spinBtn.disabled=false;
      setProgress(finalProgress);announce();
    };

    if(reduced.matches){
      animateTo(finalProgress,.2,'power2.out',done);
      return {target,turns:0,finalProgress};
    }
    /* two phases so the spin has a real attack: a short wind-up that accelerates
       into the fast pass, then a long settle. */
    const windUp=Math.min(1.4,n*.55);
    tween?.kill?.();
    const s={p:progress};
    tween=gsap.timeline({onUpdate(){setProgress(s.p)},onComplete:done})
      .to(s,{p:progress+windUp,duration:.42,ease:'power2.in'})
      .to(s,{p:finalProgress,duration:1.5+turns*.42,ease:'power3.out'});
    return {target,turns,finalProgress};
  }

  /* ---------- gesture: pointer travel IS progress ---------- */
  function onDown(e){
    if(!isPizza()||spinning||!N())return;
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=lastX=e.clientX;startProgress=progress;
    lastT=e.timeStamp||performance.now();velocity=0;
    tween?.kill?.();
    root.dataset.pizzaDrag='1';
    try{stage.setPointerCapture?.(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    const now=e.timeStamp||performance.now(),dt=Math.max(1,now-lastT);
    velocity=velocity*.6+((e.clientX-lastX)/dt)*.4;
    lastX=e.clientX;lastT=now;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>6)moved=true;
    /* the slices move while the finger is down; nothing waits for the release */
    setProgress(startProgress-dx/(isMobile()?DRAG_UNIT.mobile:DRAG_UNIT.desktop));
  }
  function onUp(e){
    if(!dragging||(pointerId!==null&&e.pointerId!==pointerId))return;
    dragging=false;pointerId=null;
    delete root.dataset.pizzaDrag;
    try{stage.releasePointerCapture?.(e.pointerId)}catch{}
    if(!moved){
      /* a tap, not a drag: select the slice that was pressed */
      const b=e.target?.closest?.('.ps-slice');
      if(b){const i=Number(b.dataset.index);i===activeIndex()?announce():goTo(i)}
      return;
    }
    const flung=Math.abs(velocity)>FLING;
    const frac=Math.abs(progress-startProgress);
    (frac>RELEASE||flung)?settle():animateTo(Math.round(startProgress),.42,'power3.out');
  }

  /* ---------- wiring, guarded by mode so nothing leaks ---------- */
  function bind(){
    if(mounted)return;
    mounted=true;
    stage.addEventListener('pointerdown',onDown);
    addEventListener('pointermove',onMove,{passive:true});
    addEventListener('pointerup',onUp);
    addEventListener('pointercancel',onUp);
    prevBtn?.addEventListener('click',()=>step(-1));
    nextBtn?.addEventListener('click',()=>step(1));
    spinBtn?.addEventListener('click',()=>spin());
    stage.addEventListener('keydown',e=>{
      if(!isPizza())return;
      if(e.key==='ArrowRight'){e.preventDefault();step(1)}
      else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}
      else if(e.key==='Enter'||e.key===' '){
        const b=e.target?.closest?.('.ps-slice');
        if(b){e.preventDefault();const i=Number(b.dataset.index);i===activeIndex()?announce():goTo(i)}
      }
    });
    addEventListener('resize',()=>{if(isPizza())place()});
  }
  function unbind(){
    if(!mounted)return;
    mounted=false;
    stage?.removeEventListener('pointerdown',onDown);
    removeEventListener('pointermove',onMove);
    removeEventListener('pointerup',onUp);
    removeEventListener('pointercancel',onUp);
  }

  /* ---------- activation ---------- */
  async function activate(){
    injectStudioOption();ensureStyles();
    if(isPizza()){
      await loadManifest();
      if(!N()){root.dataset.pizzaSliceOrbit='no-manifest';return}
      if(!ensureStage())return;
      buildSlices();
      stage.hidden=false;
      bind();
      /* the base orbital stage is not ours to render, so it simply steps aside */
      render();announce();
      root.dataset.pizzaSliceOrbit='ready';
      root.dataset.orbitalChoreography='pizza-slice-orbit-v1';
    }else{
      /* Leave nothing behind: no tween, no spin, no listeners, no datasets, no vars. */
      tween?.kill?.();tween=null;
      spinning=false;dragging=false;pointerId=null;
      unbind();
      if(stage)stage.hidden=true;
      if(spinBtn)spinBtn.disabled=false;
      delete root.dataset.pizzaSliceOrbit;
      delete root.dataset.pizzaProgress;
      delete root.dataset.pizzaDrag;
      delete root.dataset.pizzaSpin;
      root.style.removeProperty('--ps-accent');
      announced=-1;
    }
  }

  new MutationObserver(()=>{activate()})
    .observe(root,{attributes:true,attributeFilter:['data-orbital-motion']});

  /* ---------- boot ---------- */
  function boot(){
    if(ready)return;
    if(!window.gsap||!$('.orbit-shell'))return;
    if(!injectStudioOption())return;
    ready=true;
    ensureStyles();
    activate();
    restoreSavedChoice();
  }
  /* The Studio applies the saved config before this runtime injects its option, so a
     project saved on this preset would silently fall back. Re-apply once, for this
     mode only. */
  async function restoreSavedChoice(){
    try{
      const saved=await window.RestaurantStore?.loadProject?.();
      const select=$('#motion-orbital-style');
      if(saved?.config?.motion?.orbitalStyle!==MODE||!select||select.value===MODE)return;
      select.value=MODE;
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
      window.RestaurantMotionStudio?.publish?.();
    }catch(e){}
  }
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},120);
  setTimeout(()=>clearInterval(timer),20000);
  boot();

  window.RestaurantPizzaSliceOrbit={
    MODE,
    activate,
    step,goTo,spin,
    /* test seam: a deterministic RNG so the suite can force a target without flake */
    setRng(fn){rng=typeof fn==='function'?fn:(()=>Math.random())},
    setProgress(v){tween?.kill?.();setProgress(Number(v)||0);announce()},
    state(){
      return {mode:root.dataset.orbitalMotion,ready:root.dataset.pizzaSliceOrbit==='ready',
        progress,activeIndex:activeIndex(),count:N(),
        activeId:slices[activeIndex()]?.id||null,
        activeName:slices[activeIndex()]?.name||null,
        spinning,dragging,
        /* a caller cannot tell a finished step from one that has not started yet
           without this: progress is a whole number at both moments */
        animating:!!(tween&&tween.isActive&&tween.isActive()),
        reduced:reduced.matches,
        canonical:manifest?.canonical||null};
    },
    /* what the orbit is doing right now, straight from the one scalar */
    frame(){
      return els.map((el,i)=>({index:i,id:slices[i]?.id,
        front:+el.dataset.front,hero:el.dataset.hero==='1',
        z:+el.style.zIndex||0,opacity:+el.style.opacity,
        distance:+continuousDistance(i).toFixed(4)}));
    }
  };
})();
