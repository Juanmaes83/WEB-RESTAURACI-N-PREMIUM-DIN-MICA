/* CLASS 10 · PROJECT 03 — ORBITAL FOOD SLIDER

   The geometry of the product defines the navigation.

   This preset owns PRESENTATION AND DERIVED CHOREOGRAPHY. It does not own state.
   There is no second active index, no second orbit progress, no second gesture
   engine and no second dish model: the base Orbital Engine in app-v4.js keeps all
   of that, and this file reads it through window.RestaurantOrbit — the adapter that
   exposes the engine rather than copying it.

   What the engine hands over per dish, per frame:
     distance · angle · front · progress · the shell box
   What this file decides:
     trajectory · depth · scale curve · z-order · tone · decor orbit · typography ·
     colour world

   So the drag is already GESTURE = PROGRESS, momentum and snap are already the
   engine's, and wheel / buttons / keyboard converge because they all end in
   animateProgress(). Nothing here re-implements them.
*/
(() => {
  'use strict';
  const MODE='orbital-food';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  /* Fallback worlds, only for a project that has no motion metadata at all. */
  const FALLBACK=[
    {accent:'#ff5a2b',backgroundColor:'#1a0d08'},
    {accent:'#3f7bff',backgroundColor:'#080f22'},
    {accent:'#d8ff4f',backgroundColor:'#12160a'},
    {accent:'#37d6c0',backgroundColor:'#041614'},
    {accent:'#ff3b5c',backgroundColor:'#1a0710'},
    {accent:'#ffb43a',backgroundColor:'#1a1206'}
  ];

  /* Direction, not law. Product rides the orbit at 1.00 by definition — it IS the
     orbit — so these are the two choreographies layered around it. */
  const RATE={decorBack:.48,decorFront:1.26};

  let root=document.documentElement,section=null,shell=null,copy=null;
  let stage=null,world=null,glow=null,decorBack=null,decorFront=null,wordLayer=null;
  let priceEl=null,ingEl=null,eyebrowEl=null,copyEl=null;
  let meta=new Map(),order=[],built=0;
  let unsubProgress=null,unsubActive=null,ready=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  const orbit=()=>window.RestaurantOrbit;
  const isFood=()=>root.dataset.orbitalMotion===MODE;
  const isMobile=()=>innerWidth<820;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const hex2rgb=h=>{const v=String(h||'').replace('#','');const n=v.length===3?v.split('').map(c=>c+c).join(''):v;
    const i=parseInt(n,16);return Number.isFinite(i)?[i>>16&255,i>>8&255,i&255]:[216,255,79]};
  const rgb=c=>`rgb(${c.map(v=>Math.round(v)).join(',')})`;
  const rgba=(c,a)=>`rgba(${c.map(v=>Math.round(v)).join(',')},${a})`;
  const asList=v=>(Array.isArray(v)?v:String(v||'').split('|')).map(x=>String(x).trim()).filter(Boolean);
  const firstWord=n=>String(n||'').trim().split(/[\s/·—-]+/).filter(Boolean)[0]||'DISH';

  /* ---------- data: one dish model, extended, never duplicated ----------
     Priority is orbitalFood → existing reusable metadata → fallback, so Project 03
     inherits the palette, the word and the decor that Depth Carousel already
     described, and a project can still override any of it per dish. */
  function metaFor(dish,i){
    const fb=FALLBACK[i%FALLBACK.length];
    const base={word:firstWord(dish?.name),accent:fb.accent,backgroundColor:fb.backgroundColor,
      foregroundDecor:'',backgroundDecor:'',orbitScale:1,rotationBias:0};
    return {...base,...(dish?.depthCarousel||{}),...(dish?.orbitalFood||{}),dish};
  }
  function loadMeta(){
    const dishes=orbit()?.getDishes?.()||[];
    order=dishes.map(d=>d.id);
    meta=new Map(dishes.map((d,i)=>[d.id,metaFor(d,i)]));
    return dishes;
  }
  function infoAt(i){
    const id=order[i];
    if(id&&meta.has(id))return meta.get(id);
    return metaFor(null,i);
  }

  /* ---------- studio + styles ---------- */
  function injectStudioOption(){
    const select=$('#motion-orbital-style');
    if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const o=document.createElement('option');
      o.value=MODE;o.textContent='Orbital Food Slider';select.appendChild(o);
    }
    return true;
  }
  function ensureStyles(){
    if($('link[data-orbital-food-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v10.css';l.dataset.orbitalFoodStyles='1';
    document.head.appendChild(l);
  }

  /* ---------- layers ---------- */
  function ensureStage(){
    section=section||$('.orbital-section');
    shell=shell||$('.orbit-shell');
    copy=copy||$('.dish-copy');
    if(!section||!shell)return false;
    if(!stage?.isConnected){
      stage=document.createElement('div');stage.className='of-stage';stage.setAttribute('aria-hidden','true');
      world=document.createElement('div');world.className='of-world';
      glow=document.createElement('div');glow.className='of-glow';
      decorBack=document.createElement('div');decorBack.className='of-decor of-decor-back';
      wordLayer=document.createElement('div');wordLayer.className='of-words';
      decorFront=document.createElement('div');decorFront.className='of-decor of-decor-front';
      /* the product itself lives in #orbit-stage, between the back and front layers —
         it is the base engine's DOM, re-composed, not a copy of it */
      stage.append(world,glow,decorBack,wordLayer,decorFront);
      section.insertBefore(stage,section.firstChild);
    }
    eyebrowEl=$('.of-eyebrow',section);
    if(!eyebrowEl){
      eyebrowEl=document.createElement('p');eyebrowEl.className='of-eyebrow';
      eyebrowEl.innerHTML='<span>Signature collection</span><span class="of-eyebrow-hint">Gira la colección</span>';
      section.insertBefore(eyebrowEl,shell);
    }
    if(copy&&!$('.of-copy',copy)){
      copyEl=document.createElement('div');copyEl.className='of-copy';
      copyEl.innerHTML='<span class="of-price"></span><span class="of-ingredients"></span>';
      const explore=$('#explore-dish');
      explore?copy.insertBefore(copyEl,explore):copy.appendChild(copyEl);
    }
    priceEl=$('.of-price',copy||document);ingEl=$('.of-ingredients',copy||document);
    return true;
  }

  /* One word and two decor groups per dish, built once. Every frame only moves
     them, so the orbit stays cheap however many dishes a restaurant has. */
  function buildLayers(dishes){
    if(built===dishes.length&&wordLayer.children.length===dishes.length)return;
    built=dishes.length;
    wordLayer.innerHTML='';decorBack.innerHTML='';decorFront.innerHTML='';
    dishes.forEach((d,i)=>{
      const info=infoAt(i);
      const w=document.createElement('span');
      w.className='of-word';w.dataset.index=String(i);w.textContent=info.word;
      wordLayer.appendChild(w);
      [['back',decorBack],['front',decorFront]].forEach(([layer,host])=>{
        const g=document.createElement('div');
        g.className=`of-decor-group of-decor-${layer}-group`;g.dataset.index=String(i);
        asList(layer==='back'?info.backgroundDecor:info.foregroundDecor).slice(0,3).forEach((src,k)=>{
          const el=document.createElement('div');
          el.className='of-decor-item';el.dataset.phase=String(k);
          el.style.backgroundImage=`url("${src}")`;
          g.appendChild(el);
        });
        host.appendChild(g);
      });
    });
  }

  /* ---------- geometry ----------
     A perspective read rather than a rail: the orbit widens as it comes forward, the
     scale curve is steep enough that the hero dominates, and the vertical travel is
     non-linear so the front three do not line up. The hero arrives low and large —
     out of depth, toward the viewer — and leaves the same way. */
  function geometry(d,a,front,box,mobile,info){
    const f=clamp(front,0,1);
    const rx=(mobile?.46:.38)*box.w, ry=(mobile?.23:.26)*box.h;
    const depth=Math.pow(f,mobile?2.0:2.2);
    const spread=mobile?(.60+.24*f):(.52+.34*f);
    /* On desktop the orbit sits right of centre and rides high: the editorial column
       owns the lower left, and a plate crossing the dish title is clutter no scrim
       fixes. Centred and low, the left neighbour landed straight on the copy. */
    const cx=mobile?0:box.w*.11, cy=mobile?0:-box.h*.15;
    const x=cx+Math.sin(a)*rx*spread;
    const y=cy+ry*(-0.58+1.15*Math.pow(f,1.6))+Math.abs(Math.sin(a))*ry*.10;
    const scale=((mobile?.26:.30)+depth*(mobile?1.00:1.15))*(Number(info.orbitScale)||1);
    return {
      x,y,scale,
      /* rear stays legible: it is context, not noise, so opacity bottoms out at .30
         and the blur never becomes a stand-in for depth */
      opacity:.30+f*.70,
      blur:(1-f)*(mobile?1.6:2.2),
      brightness:.46+f*.60,
      saturate:.55+f*.50,
      rotation:-Math.sin(a)*(mobile?5:7)+(Number(info.rotationBias)||0)*(1-f),
      z:Math.round(f*100)
    };
  }

  /* ---------- the dish renderer, registered with the engine ---------- */
  function renderDish({el,index,distance,angle,front,shell:sh,mobile}){
    const box={w:sh.clientWidth,h:sh.clientHeight};
    const g=geometry(distance,angle,front,box,mobile||isMobile(),infoAt(index));
    gsap.set(el,{xPercent:-50,yPercent:-50,x:g.x,y:g.y,scale:g.scale,rotation:g.rotation,
      opacity:g.opacity,zIndex:g.z,
      filter:`blur(${g.blur.toFixed(2)}px) brightness(${g.brightness.toFixed(3)}) saturate(${g.saturate.toFixed(3)})`});
    el.dataset.orbitFront=front.toFixed(3);
  }

  /* ---------- everything the progress drives ---------- */
  function paintFrame(progress){
    if(!isFood()||!stage||!shell)return;
    const o=orbit();if(!o)return;
    const n=o.getCount();if(!n)return;
    const mobile=isMobile();
    const box={w:shell.clientWidth,h:shell.clientHeight};

    /* Weights from the same fractional progress the products use, so the world, the
       typography and the decor cannot drift out of step with the orbit. */
    const w=[],infos=[];
    let sum=0,heroX=0,heroY=0;
    for(let i=0;i<n;i++){
      const d=o.continuousDistance(i),a=d*Math.PI*2/n,front=(Math.cos(a)+1)/2;
      const info=infoAt(i);infos.push({i,d,a,front,info});
      const k=Math.pow(clamp(front,0,1),4);
      w.push(k);sum+=k;
      const g=geometry(d,a,front,box,mobile,info);
      heroX+=g.x*k;heroY+=g.y*k;
    }
    sum=sum||1;heroX/=sum;heroY/=sum;

    /* World: a continuous blend across the collection, not a swap at the snap. */
    let acc=[0,0,0],bg=[0,0,0];
    infos.forEach(({info},i)=>{
      const k=w[i]/sum, A=hex2rgb(info.accent), B=hex2rgb(info.backgroundColor);
      acc=[acc[0]+A[0]*k,acc[1]+A[1]*k,acc[2]+A[2]*k];
      bg=[bg[0]+B[0]*k,bg[1]+B[1]*k,bg[2]+B[2]*k];
    });
    root.style.setProperty('--of-accent',rgb(acc));
    world.style.background=[
      `radial-gradient(ellipse 66% 52% at ${(50+heroX/box.w*100*.5).toFixed(1)}% 26%, ${rgba(acc,.30)} 0%, transparent 62%)`,
      `radial-gradient(ellipse 78% 62% at 14% 88%, ${rgba(acc.map(v=>v*.5),.24)} 0%, transparent 68%)`,
      `linear-gradient(172deg, ${rgb(bg)} 0%, #04040a 82%)`
    ].join(',');

    /* The light pool the hero stands in, tracking the hero's real orbital position. */
    gsap.set(glow,{x:heroX,y:heroY+box.h*.16,opacity:.55});
    glow.style.background=`radial-gradient(ellipse 50% 50% at 50% 50%, ${rgba(acc,.34)} 0%, ${rgba(acc,.10)} 46%, transparent 74%)`;

    /* Typography: every dish owns its word, and the word is only legible while its
       product holds the front of the orbit. Two words therefore cross over on their
       own during a transition — derived from progress, never a second timeline. */
    $$('.of-word',wordLayer).forEach(el=>{
      const i=Number(el.dataset.index);const s=infos[i];if(!s)return;
      const f=clamp(s.front,0,1);
      /* The words travel with their own product, far enough apart that the pair
         crossing the front slides past instead of stacking into one smudge. */
      gsap.set(el,{x:Math.sin(s.a)*box.w*(mobile?.16:.26),
        y:-box.h*(mobile?.02:.03)*(1-f),
        rotation:Math.sin(s.a)*2.2,scale:.94+f*.10,
        /* Every dish owns a word and they all share one line, so the falloff has to
           be a gate, not a curve: at the fourth power three words were legible at
           once and the layer read as overlapping letters. Below .86 front a word is
           silent; across the last sliver only the front pair speaks, and they cross
           over exactly where the engine flips its active index. */
        opacity:f<=.86?0:Math.pow((f-.86)/.14,1.9)*(mobile?.46:.56)});
    });

    /* Decor orbit: a second choreography on its own angular rate, belonging to the
       product it came from — it fades with that product, so it can never read as
       confetti that outlives its dish. */
    [[decorBack,RATE.decorBack,.62,-.24],[decorFront,RATE.decorFront,1.06,.30]].forEach(([host,rate,radius,lift])=>{
      $$('.of-decor-group',host).forEach(group=>{
        const i=Number(group.dataset.index);const s=infos[i];if(!s)return;
        const dishF=Math.pow(clamp(s.front,0,1),2);
        if(dishF<.02){gsap.set(group,{opacity:0});return}
        gsap.set(group,{opacity:1});
        $$('.of-decor-item',group).forEach(item=>{
          const phase=Number(item.dataset.phase)*(Math.PI*2/3)+i*.7;
          const ad=s.a*rate+phase;
          const fd=(Math.cos(ad)+1)/2;
          gsap.set(item,{
            x:Math.sin(ad)*box.w*.5*radius,
            y:box.h*(lift-.34*fd)+Math.cos(ad)*box.h*.10,
            scale:(.55+fd*.65)*(rate>1?1:.8),
            rotation:Math.sin(ad)*22,
            opacity:dishF*(.22+fd*.62),
            zIndex:Math.round(fd*40)
          });
        });
      });
    });

    /* The hero marker comes from the engine's nearestIndex(), NOT from
       getActiveIndex(). renderOrbit runs before syncActive inside the engine's own
       pass, so reading the active index here reports the previous dish for one
       frame — and Class 06, which reads this marker, then rewrote the copy back to
       it and undid the handover. nearestIndex is derived straight from progress, so
       it is already correct in this pass and still flips at the canonical
       half-way point. */
    const activeIdx=o.nearestIndex();
    $$('#orbit-stage .orbit-dish').forEach((el,i)=>{
      if(i===activeIdx)el.dataset.orbitHero='1';else el.dataset.orbitHero='0';
    });

    root.dataset.orbitFoodProgress=(((progress%n)+n)%n).toFixed(3);
  }

  /* ---------- copy: the engine's crossover is the cue ----------
     Title, meta and description are still written by the base engine when its active
     index changes at the canonical crossover. Price and ingredients are written here
     from the SAME index, so they cannot describe a different dish. */
  function commitCopy(index){
    const info=infoAt(index),d=info.dish||{};
    if(priceEl)priceEl.textContent=d.price||'';
    if(ingEl)ingEl.textContent=d.ingredients||d.meta||'';
  }

  /* ---------- activation ---------- */
  function activate(){
    injectStudioOption();ensureStyles();
    if(!ensureStage())return;
    const o=orbit();if(!o)return;

    if(isFood()){
      const dishes=loadMeta();
      if(!dishes.length)return;
      buildLayers(dishes);
      stage.hidden=false;
      o.setDishRenderer(renderDish);
      if(!unsubProgress)unsubProgress=o.subscribeProgress(paintFrame);
      if(!unsubActive)unsubActive=o.subscribeActive(commitCopy);
      commitCopy(o.getActiveIndex());
      paintFrame(o.getProgress());
      root.dataset.orbitalFood='ready';
      root.dataset.orbitalChoreography='orbital-food-v1';
    }else{
      /* Leave nothing behind: the renderer is handed back, the layers hide, and every
         property this preset set on the engine's own elements is cleared so the next
         preset inherits a clean orbit. */
      if(stage)stage.hidden=true;
      if(o.hasDishRenderer?.())o.setDishRenderer(null);
      unsubProgress?.();unsubProgress=null;
      unsubActive?.();unsubActive=null;
      $$('#orbit-stage .orbit-dish').forEach(el=>{
        delete el.dataset.orbitFront;delete el.dataset.orbitHero;
      });
      delete root.dataset.orbitalFood;delete root.dataset.orbitFoodProgress;
      root.style.removeProperty('--of-accent');
    }
  }

  /* The Studio writes the mode onto <html>, so that attribute is the only signal
     this preset needs to come on or stand down. */
  new MutationObserver(()=>activate())
    .observe(root,{attributes:true,attributeFilter:['data-orbital-motion']});

  /* Dishes can be added, removed or reordered in the Studio: the base engine
     rebuilds #orbit-stage, and the layers follow that, never a copy of it. */
  const stageHost=$('#orbit-stage');
  if(stageHost)new MutationObserver(()=>{
    if(!isFood())return;
    const dishes=loadMeta();
    if(dishes.length){buildLayers(dishes);paintFrame(orbit().getProgress())}
  }).observe(stageHost,{childList:true});

  addEventListener('resize',()=>{if(isFood()&&orbit())paintFrame(orbit().getProgress())});

  /* This preset's option is injected by a runtime that loads after the Studio has
     already applied the saved config. If the project was saved on this preset, the
     select had no such option at that moment and silently fell back, so the choice
     appeared not to persist. Re-apply it once, only for this mode. */
  async function restoreSavedChoice(){
    try{
      const saved=await window.RestaurantStore?.loadProject?.();
      const want=saved?.config?.motion?.orbitalStyle;
      const select=$('#motion-orbital-style');
      if(want!==MODE||!select||select.value===MODE)return;
      select.value=MODE;
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
      window.RestaurantMotionStudio?.publish?.();
    }catch(e){}
  }

  /* ---------- boot ---------- */
  function boot(){
    if(ready)return;
    if(!window.gsap||!orbit()?.subscribeProgress||!$('.orbit-shell'))return;
    if(!injectStudioOption())return;
    ready=true;
    ensureStyles();
    activate();
    restoreSavedChoice();
  }
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},120);
  setTimeout(()=>clearInterval(timer),20000);
  boot();

  window.RestaurantOrbitalFood={
    MODE,
    activate,
    rebuild(){const d=loadMeta();buildLayers(d);paintFrame(orbit().getProgress())},
    geometryFor(i){
      const o=orbit();if(!o)return null;
      const n=o.getCount(),d=o.continuousDistance(i),a=d*Math.PI*2/n;
      return geometry(d,a,(Math.cos(a)+1)/2,{w:shell.clientWidth,h:shell.clientHeight},isMobile(),infoAt(i));
    },
    /* Deliberately reports the ENGINE's numbers: there is no separate progress or
       active index to report, and a test can prove that here. */
    state(){
      const o=orbit();
      return {mode:root.dataset.orbitalMotion,ready:!!root.dataset.orbitalFood,
        progress:o?.getProgress?.(),active:o?.getActiveIndex?.(),count:o?.getCount?.(),
        words:wordLayer?wordLayer.children.length:0,
        decorGroups:(decorBack?decorBack.children.length:0)+(decorFront?decorFront.children.length:0),
        usesEngineRenderer:!!o?.hasDishRenderer?.(),
        reduced:reduced.matches};
    }
  };
})();
