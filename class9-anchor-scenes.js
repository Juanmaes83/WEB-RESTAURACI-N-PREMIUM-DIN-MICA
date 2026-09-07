/* CLASS 09 · PROJECT 02 — ANCHOR SCENE SWAP (precomposed anchor scenes)
   Additive Motion Engine preset. Studio → Motion → "Anchor Scenes".

   Contract inherited from Project 01, unchanged:
     · The Orbital Engine (app-v4 / class4-runtime-guard) is the AUTHORITATIVE dish
       state; #dish-counter is the single source of truth for the active index.
     · This engine owns only the visible choreography. #orbit-stage stays hidden.
     · Navigation is committed by clicking the real base dish, so copy, detail, the
       Class 06 product layer, Studio and persistence keep working untouched.
     · No second index, no second dish model, no duplicated detail or persistence.

   THE PIVOT
     The first Project 02 assembled a hand out of BACK / PRODUCT / FRONT layers at
     runtime. Human review rejected it: the hand read as cut apart. This engine does
     not composite a hand at all. Each product is ONE flattened master scene that
     already contains the same hand, the same framing and the same lighting; only the
     object and the chromatic world differ.

   WHY THAT MAKES THE TRANSITION WORK
     Because the hand is identical pixels in every scene, a soft-edged wipe between
     two scenes is INVISIBLE on the hand and visible only where the object and the
     background differ. The anchor therefore reads as perfectly continuous while the
     product and the world change around it — which is the effect the brief asks for,
     obtained by removing machinery rather than adding it.

     The scenes themselves never translate: moving them would move the hand and break
     that illusion. The spatial feel comes from the decor layers, which are engine
     side and free to travel at their own rates.
*/
(() => {
  'use strict';
  if(!window.gsap)return;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const shell=$('.orbit-shell'), baseStage=$('#orbit-stage'), copy=$('.dish-copy'), controls=$('.orbit-controls');
  const section=$('.orbital-section');
  if(!shell||!baseStage||!copy||!section)return;

  const MODE='anchor-scenes';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const FALLBACK=[
    {accent:'#ff6a3c',backgroundColor:'#1e0a05'},{accent:'#4f8dff',backgroundColor:'#050f22'},
    {accent:'#b9e24d',backgroundColor:'#101c07'},{accent:'#34d3c6',backgroundColor:'#041d1d'},
    {accent:'#ef5b7e',backgroundColor:'#1d0611'},{accent:'#ffc23d',backgroundColor:'#201202'}
  ];

  /* Layer rates. The scenes are 0: they are the anchor. */
  /* The word drifts rather than slides. At .55 the incoming word entered from half a
   viewport above its rest position, which put it straight through the section
   eyebrow; the left column has no room for a travelling headline. A short drift
   also suits photography better than a slab of type crossing the frame. */
const RATE={scene:0,decorBack:.35,word:.14,decorFront:1.20};
  const FEATHER=14;      /* % of height: the soft band of the wipe */
  const COMMIT_IN=.55, COMMIT_OUT=.45;
  const RELEASE=.42;

  let scene=null,sceneA=null,sceneB=null,seam=null,wordEl=null;
  let decorBack=null,decorFront=null,priceEl=null,ingEl=null,dotsEl=null,eyebrowEl=null,copyEl=null;
  let restIndex=0,outIndex=0,inIndex=0,progress=0,direction=1,committed=false;
  let dragging=false,pointerId=null,startX=0,startY=0,lastY=0,lastT=0,velocity=0,moved=false;
  let tween=null,booted=false,internalPass=false,meta=new Map();
  let baseSyncTarget=null,baseSyncTimer=null,lastWheel=0,pendingRebuild=false;

  const isScenes=()=>root.dataset.orbitalMotion===MODE;
  const detailOpen=()=>root.dataset.dishDetail==='open'||document.body.classList.contains('detail-open');
  const isMobile=()=>innerWidth<820;
  const baseDishes=()=>$$('.orbit-dish',baseStage);
  const count=()=>baseDishes().length;
  const normalize=(n,total=count())=>total?((n%total)+total)%total:0;
  const counterIndex=()=>{const n=parseInt($('#dish-counter')?.textContent||'',10);return Number.isFinite(n)?Math.max(0,n-1):0};
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const smooth=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t)};
  const hex2rgb=h=>{const v=String(h||'').replace('#','');const n=v.length===3?v.split('').map(c=>c+c).join(''):v;const i=parseInt(n,16);return Number.isFinite(i)?[i>>16&255,i>>8&255,i&255]:[216,255,79]};
  const rgb2css=c=>`rgb(${c.map(v=>Math.round(v)).join(',')})`;
  const mixRgb=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const lighten=(h,t)=>rgb2css(mixRgb(hex2rgb(h),[255,255,255],t));
  const asList=v=>(Array.isArray(v)?v:String(v||'').split('|')).map(x=>String(x).trim()).filter(Boolean);

  /* ---------- data: the dish model, extended once more, never duplicated ---------- */
  const firstWord=n=>String(n||'').trim().split(/[\s/·—-]+/).filter(Boolean)[0]||'DISH';
  function defaultMeta(dish,i){
    const fb=FALLBACK[i%FALLBACK.length];
    return {image:'',hit:null,word:firstWord(dish?.name),
      accent:dish?.editorialFlow?.color||fb.accent,backgroundColor:fb.backgroundColor,
      foregroundDecor:'',backgroundDecor:''};
  }
  async function loadMeta(){
    let dishes=window.RestaurantDefaults?.dishes||[];
    try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config?.dishes?.length)dishes=saved.config.dishes}catch{}
    /* anchorScene wins over depthCarousel, which supplies word / accent / decor so a
       project does not have to describe its palette twice. */
    meta=new Map(dishes.filter(d=>d.enabled!==false).map((d,i)=>
      [d.id,{...defaultMeta(d,i),...(d.depthCarousel||{}),...(d.anchorScene||{}),dish:d}]));
  }
  function sceneFor(index){
    const el=baseDishes()[normalize(index)];
    const id=el?.dataset.id;
    if(id&&meta.has(id))return meta.get(id);
    const list=(window.RestaurantDefaults?.dishes||[]).filter(d=>d.enabled!==false);
    const i=normalize(index,list.length||1),d=list[i]||{};
    return {...defaultMeta(d,i),...(d.depthCarousel||{}),...(d.anchorScene||{}),dish:d};
  }
  /* No master scene? Fall back to the object cut-out over a derived world, so a
     project without the photography still renders something coherent. */
  function hasScene(info){return !!info.image}
  /* Only dishes that own a real master scene are navigable here. A dish without one
     would drop the hand mid-swap and break the single thing this preset exists to
     sell, so it is skipped rather than faked. With no scenes at all the ring is
     every dish, and the fallback carries the section. */
  function ring(){
    const all=baseDishes().map((_,i)=>i);
    const real=all.filter(i=>hasScene(sceneFor(i)));
    return real.length?real:all;
  }
  function ringStep(from,dir){
    const r=ring();if(!r.length)return normalize(from);
    const at=r.indexOf(normalize(from));
    if(at<0)return dir>0?r[0]:r[r.length-1];
    return r[((at+dir)%r.length+r.length)%r.length];
  }
  function worldFor(info){
    const a=hex2rgb(info.accent),base=info.backgroundColor||'#0a0a08';
    const glow=(t,al)=>`rgba(${a.map(v=>Math.round(v*t)).join(',')},${al})`;
    return [
      `radial-gradient(ellipse 74% 58% at 66% 22%, ${glow(1,.44)} 0%, transparent 64%)`,
      `radial-gradient(ellipse 62% 54% at 10% 86%, ${glow(.58,.36)} 0%, transparent 68%)`,
      `linear-gradient(172deg, ${base} 0%, #05050a 78%)`
    ].join(',');
  }

  /* ---------- studio + styles ---------- */
  function injectStudioOption(){
    const select=$('#motion-orbital-style');
    if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const o=document.createElement('option');o.value=MODE;o.textContent='Anchor Scenes';select.appendChild(o);
    }
    return true;
  }
  function ensureStyles(){
    if($('link[data-anchor-scenes-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v9.css';l.dataset.anchorScenesStyles='1';
    document.head.appendChild(l);
  }

  /* ---------- scene construction ---------- */
  function ensureScene(){
    if(!scene?.isConnected){
      scene=document.createElement('div');scene.className='sc-stage';scene.setAttribute('aria-hidden','true');
      /* Each scene is a wrapper: a blurred full-bleed wash of the same image so the
         colour world fills the frame, plus the sharp subject contained inside it so
         the hand is never cropped. The mask goes on the wrapper, so both move as one. */
      const mkScene=cls=>{
        const w=document.createElement('div');w.className=`sc-scene ${cls}`;
        const wash=document.createElement('div');wash.className='sc-wash';
        const subj=document.createElement('div');subj.className='sc-subject';
        w.append(wash,subj);return w;
      };
      sceneA=mkScene('sc-scene-a');
      sceneB=mkScene('sc-scene-b');
      seam=document.createElement('div');seam.className='sc-seam';
      decorBack=document.createElement('div');decorBack.className='sc-decor sc-decor-back';
      wordEl=document.createElement('div');wordEl.className='sc-word';
      decorFront=document.createElement('div');decorFront.className='sc-decor sc-decor-front';
      /* decor behind, then the two scenes, then decor in front */
      /* order: decor behind, the two scenes, the seam light, the lettering over
         them, decor in front. z-index in styles-v9.css is authoritative. */
      scene.append(decorBack,sceneA,sceneB,seam,wordEl,decorFront);
      section.insertBefore(scene,section.firstChild);
    }
    eyebrowEl=$('.sc-eyebrow',section);
    if(!eyebrowEl){
      eyebrowEl=document.createElement('p');eyebrowEl.className='sc-eyebrow';
      eyebrowEl.innerHTML='<span>Signature collection</span><span class="sc-eyebrow-hint">Arrastra para cambiar de plato</span>';
      section.insertBefore(eyebrowEl,shell);
    }
    if(!$('.sc-copy',copy)){
      copyEl=document.createElement('div');copyEl.className='sc-copy';
      copyEl.innerHTML='<span class="sc-price"></span><span class="sc-ingredients"></span>';
      const explore=$('#explore-dish');
      explore?copy.insertBefore(copyEl,explore):copy.appendChild(copyEl);
    }
    priceEl=$('.sc-price',copy);ingEl=$('.sc-ingredients',copy);
    if(controls&&!$('.sc-dots',controls)){
      dotsEl=document.createElement('div');dotsEl.className='sc-dots';
      dotsEl.setAttribute('role','tablist');dotsEl.setAttribute('aria-label','Seleccionar plato');
      controls.appendChild(dotsEl);
    }else dotsEl=$('.sc-dots',controls||document);
  }

  function paintScene(el,info){
    const wash=el.querySelector('.sc-wash'), subj=el.querySelector('.sc-subject');
    /* Registration comes from the data and is applied as custom properties, never as
       an inline transform: the box's own transform differs between desktop and
       mobile, and overwriting it would flatten that. A photograph that sits a few
       pixels off is corrected by its own numbers, so a new set is a data drop. */
    const reg=info.registration||{};
    el.style.setProperty('--sc-reg-s',String(Number(reg.scale)||1));
    el.style.setProperty('--sc-reg-x',`${(Number(reg.offsetX)||0)*100}%`);
    el.style.setProperty('--sc-reg-y',`${(Number(reg.offsetY)||0)*100}%`);
    if(reg.aspect)el.style.setProperty('--sc-aspect',String(reg.aspect));
    if(hasScene(info)){
      wash.style.backgroundImage=`url("${info.image}")`;
      subj.style.backgroundImage=`url("${info.image}")`;
      el.dataset.kind='scene';
    }else{
      /* graceful fallback: the derived world plus the object cut-out, no hand */
      wash.style.background=worldFor(info);
      subj.style.backgroundImage=info.asset?`url("${info.asset}")`:'none';
      el.dataset.kind='fallback';
    }
  }

  function decorGroup(info,layer){
    const g=document.createElement('div');g.className='sc-decor-group';
    if(layer==='back'){
      const a=hex2rgb(info.accent);
      const atmo=document.createElement('div');atmo.className='sc-atmo';
      atmo.style.background=`radial-gradient(ellipse 56% 48% at 50% 50%, rgba(${a.join(',')},.20) 0%, rgba(${a.map(v=>Math.round(v*.5)).join(',')},.08) 54%, transparent 80%)`;
      g.appendChild(atmo);
    }
    const items=asList(layer==='back'?info.backgroundDecor:info.foregroundDecor);
    /* kept off the copy column and off the controls: a decor cut-out landing on the
       dish counter reads as a bug, not as atmosphere */
    const anchors=layer==='back'?[[24,20],[15,56]]:[[30,74],[88,19]];
    items.slice(0,anchors.length).forEach((src,n)=>{
      const el=document.createElement('div');el.className='sc-decor-item';
      el.style.backgroundImage=`url("${src}")`;
      el.style.left=`${anchors[n][0]}%`;el.style.top=`${anchors[n][1]}%`;
      g.appendChild(el);
    });
    return g;
  }

  function refreshPair(){
    outIndex=normalize(restIndex);
    inIndex=ringStep(restIndex,direction);
    paintScene(sceneA,sceneFor(outIndex));
    paintScene(sceneB,sceneFor(inIndex));
    decorBack.innerHTML='';decorFront.innerHTML='';
    decorBack.append(decorGroup(sceneFor(outIndex),'back'),decorGroup(sceneFor(inIndex),'back'));
    decorFront.append(decorGroup(sceneFor(outIndex),'front'),decorGroup(sceneFor(inIndex),'front'));
    wordEl.dataset.out=sceneFor(outIndex).word;
    wordEl.dataset.in=sceneFor(inIndex).word;
  }

  function rebuild(){
    ensureScene();
    if(detailOpen()||!count())return;
    restIndex=counterIndex();progress=0;committed=false;
    /* The base engine may be resting on a dish this preset cannot show. Step onto
       the ring before painting anything, and take the base engine with us. */
    const r=ring();
    if(!r.includes(normalize(restIndex))){restIndex=ringStep(restIndex,1);syncBaseTo(restIndex)}
    if(dotsEl&&dotsEl.children.length!==r.length){
      dotsEl.innerHTML='';
      r.forEach((base,n)=>{
        const dot=document.createElement('button');
        dot.type='button';dot.className='sc-dot';dot.dataset.index=String(base);
        dot.setAttribute('aria-label',`Plato ${n+1}`);
        dotsEl.appendChild(dot);
      });
    }
    refreshPair();render(0);commitText(restIndex);
  }

  /* ---------- the frame ---------- */
  function render(p){
    if(!scene)return;
    const H=shell.clientHeight,dir=direction,t=clamp(p,0,1);

    /* The wipe. A soft-edged mask, so the band where the two scenes overlap is
       narrow and — over the hand, which is identical pixels — invisible. Travel
       covers -FEATHER..100+FEATHER so the band is fully off-frame at both ends. */
    const span=100+FEATHER*2;
    const lead=dir>0 ? -FEATHER+t*span : 100+FEATHER-t*span;
    const a=dir>0?`${lead}%`:`${lead}%`;
    const b=dir>0?`${lead+FEATHER}%`:`${lead-FEATHER}%`;
    const angle=dir>0?'184deg':'4deg';
    const mask=dir>0
      ? `linear-gradient(${angle}, #000 ${a}, rgba(0,0,0,0) ${b})`
      : `linear-gradient(${angle}, rgba(0,0,0,0) ${b}, #000 ${a})`;
    /* B is revealed from the entry edge; A stays whole underneath. */
    sceneB.style.webkitMaskImage=mask;
    sceneB.style.maskImage=mask;

    if(seam){
      const show=t>.015&&t<.985;
      seam.style.opacity=show?String(.42*Math.sin(Math.PI*t)+.10):'0';
      seam.style.top=`${clamp(dir>0?lead+FEATHER*.5:lead-FEATHER*.5,-10,110)}%`;
    }

    /* Decor carries the motion the scenes deliberately do not. */
    const groups=(host,rate)=>{
      const [gOut,gIn]=host.children;
      if(gOut)gsap.set(gOut,{y:dir*t*H*rate*.5,opacity:1-smooth(.30,.80,t)});
      if(gIn)gsap.set(gIn,{y:-dir*(1-t)*H*rate*.5,opacity:smooth(.20,.70,t)});
    };
    groups(decorBack,RATE.decorBack);
    groups(decorFront,RATE.decorFront);

    /* Lettering: lags, hands over at the crossover, ramps overlap so there is no hole. */
    const showIn=t>=.5;
    wordEl.textContent=showIn?wordEl.dataset.in:wordEl.dataset.out;
    const wt=showIn?(t-.5)*2:t*2;
    gsap.set(wordEl,{y:(showIn?-(1-wt)*.5:wt*.5)*H*RATE.word*dir,
      opacity:.58*(showIn?smooth(-.25,.55,wt):1-smooth(.45,1.25,wt))});
    wordEl.style.color=lighten(sceneFor(showIn?inIndex:outIndex).accent,.46);

    /* Accent: hold, cross late and fast, hold. */
    const k=smooth(.44,.56,t);
    root.style.setProperty('--sc-accent',
      rgb2css(mixRgb(hex2rgb(sceneFor(outIndex).accent),hex2rgb(sceneFor(inIndex).accent),k)));

    /* Copy: the crossover belongs to the scene, not to the text. */
    gsap.set(copy,{opacity:1-smooth(.06,.46,t)*.94+smooth(.54,.94,t)*.94});
    if(eyebrowEl)gsap.set(eyebrowEl,{opacity:.45+(1-Math.sin(Math.PI*t))*.55});
    root.dataset.sceneProgress=t.toFixed(3);
  }

  function commitText(index){
    const info=sceneFor(index),d=info.dish||{};
    if(priceEl)priceEl.textContent=d.price||'';
    if(ingEl)ingEl.textContent=d.ingredients||d.meta||'';
    if(dotsEl)$$('.sc-dot',dotsEl).forEach(dot=>
      dot.setAttribute('aria-current',String(Number(dot.dataset.index)===normalize(index))));
  }

  /* ---------- commit back to the Orbital Engine ---------- */
  function passBaseClick(el){internalPass=true;try{el?.click()}finally{queueMicrotask(()=>{internalPass=false})}}
  function syncBaseTo(index){
    const target=normalize(index);
    clearTimeout(baseSyncTimer);
    if(counterIndex()===target){baseSyncTarget=null;return}
    /* The base engine sweeps its counter through every intermediate index while it
       tweens; without this latch the observer would chase those values back. */
    baseSyncTarget=target;
    baseSyncTimer=setTimeout(()=>{baseSyncTarget=null},1800);
    const el=baseDishes()[target];
    if(el)passBaseClick(el);   /* programmatic clicks carry clientX/Y 0 */
  }
  function openActiveDetail(){
    const base=baseDishes()[normalize(restIndex)];
    if(!base)return;
    if(typeof window.RestaurantClass6Detail?.open==='function')window.RestaurantClass6Detail.open(base);
    else passBaseClick(base);
  }
  /* The object's region inside the master scene is recorded per dish by the scene
     builder, so the clickable area is the object itself, not the whole section. */
  function overObject(x,y){
    const hit=sceneFor(restIndex).hit;
    const r=sceneA.querySelector('.sc-subject').getBoundingClientRect();
    if(!hit)return x>=r.left+r.width*.28&&x<=r.left+r.width*.78&&y>=r.top+r.height*.12&&y<=r.bottom;
    return x>=r.left+hit.x*r.width&&x<=r.left+(hit.x+hit.w)*r.width
        && y>=r.top+hit.y*r.height&&y<=r.top+(hit.y+hit.h)*r.height;
  }

  /* ---------- progress ---------- */
  function setProgress(p){
    progress=clamp(p,0,1);
    render(progress);
    if(!committed&&progress>COMMIT_IN){committed=true;syncBaseTo(inIndex)}
    else if(committed&&progress<COMMIT_OUT){committed=false;syncBaseTo(outIndex)}
  }
  function animateProgress(to,onDone){
    tween?.kill?.();
    const s={p:progress};
    const dur=reduced.matches?.01:clamp(Math.abs(to-progress)*.9,.26,.9);
    tween=gsap.to(s,{p:to,duration:dur,ease:reduced.matches?'none':'power3.out',
      onUpdate(){setProgress(s.p)},onComplete(){setProgress(to);onDone?.()}});
  }
  function complete(){
    animateProgress(1,()=>{
      restIndex=normalize(inIndex);
      syncBaseTo(restIndex);
      progress=0;committed=false;pendingRebuild=false;
      refreshPair();render(0);commitText(restIndex);
      root.dataset.orbitalChoreography='anchor-scenes-v1';
    });
  }
  function cancel(){
    animateProgress(0,()=>{
      committed=false;syncBaseTo(restIndex);commitText(restIndex);
      if(pendingRebuild){pendingRebuild=false;rebuild()}
    });
  }
  function step(dir=1){
    if(!isScenes()||detailOpen()||!count())return;
    tween?.kill?.();
    if(progress>0&&dir!==direction){cancel();return}
    direction=dir;refreshPair();complete();
  }
  function goTo(index){
    if(!isScenes()||detailOpen()||!count())return;
    const target=normalize(index),r=ring();
    if(target===normalize(restIndex)||!r.includes(target))return;
    const at=r.indexOf(normalize(restIndex)),to=r.indexOf(target);
    if(at<0||to<0)return;
    const n=r.length;let d=to-at;
    while(d>n/2)d-=n;while(d<-n/2)d+=n;
    direction=d>=0?1:-1;
    /* land on the neighbour the target arrives from, then play one full step, so a
       jump reads as the same gesture the drag produces */
    restIndex=ringStep(target,-direction);
    refreshPair();complete();
  }

  /* ---------- gesture: vertical, continuous, reversible ---------- */
  const dragUnit=()=>shell.clientHeight*(isMobile()?.40:.44);
  function onDown(e){
    if(!isScenes()||detailOpen()||!count())return;
    if(e.target.closest('.sc-dot,#next-dish,#prev-dish,#explore-dish'))return;
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=e.clientX;startY=lastY=e.clientY;
    lastT=e.timeStamp||performance.now();velocity=0;
    tween?.kill?.();
    root.dataset.sceneDrag='1';
    try{shell.setPointerCapture?.(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    const now=e.timeStamp||performance.now(),dt=Math.max(1,now-lastT);
    velocity=velocity*.6+((e.clientY-lastY)/dt)*.4;
    lastY=e.clientY;lastT=now;
    const dy=e.clientY-startY;
    if(Math.hypot(e.clientX-startX,dy)>7)moved=true;
    const raw=dy/dragUnit(), dir=raw>=0?1:-1;
    if(dir!==direction&&progress<.02){direction=dir;refreshPair()}
    setProgress(Math.abs(raw));
  }
  function onUp(e){
    if(!dragging||(pointerId!==null&&e.pointerId!==pointerId))return;
    dragging=false;pointerId=null;
    delete root.dataset.sceneDrag;
    try{shell.releasePointerCapture?.(e.pointerId)}catch{}
    if(!moved)return;
    const flung=Math.abs(velocity)>.55&&Math.sign(velocity)===direction;
    (progress>RELEASE||flung)?complete():cancel();
  }

  /* ---------- input ownership (capture phase, guarded by mode) ---------- */
  document.addEventListener('pointerdown',e=>{
    if(!isScenes()||!shell.contains(e.target))return;
    e.stopImmediatePropagation();onDown(e);
  },true);
  document.addEventListener('pointermove',e=>{if(!dragging)return;e.stopImmediatePropagation();onMove(e)},true);
  document.addEventListener('pointerup',e=>{if(!dragging)return;e.stopImmediatePropagation();onUp(e)},true);
  document.addEventListener('pointercancel',e=>{if(!dragging)return;e.stopImmediatePropagation();dragging=false;pointerId=null;delete root.dataset.sceneDrag;cancel()},true);

  document.addEventListener('click',e=>{
    if(!isScenes()||internalPass||detailOpen())return;
    const dot=e.target.closest('.sc-dot');
    if(dot){e.preventDefault();e.stopImmediatePropagation();goTo(Number(dot.dataset.index));return}
    const nav=e.target.closest('#next-dish,#prev-dish');
    if(nav){e.preventDefault();e.stopImmediatePropagation();step(nav.id==='next-dish'?1:-1);return}
    if(e.target.closest('#explore-dish')){e.preventDefault();e.stopImmediatePropagation();openActiveDetail();return}
    if(!shell.contains(e.target))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(moved){moved=false;return}
    if(progress<.02&&overObject(e.clientX,e.clientY))openActiveDetail();
  },true);

  document.addEventListener('wheel',e=>{
    if(!isScenes()||detailOpen()||!shell.contains(e.target))return;
    if(Math.abs(e.deltaY)<4)return;
    e.preventDefault();e.stopImmediatePropagation();
    const now=performance.now();if(now-lastWheel<600)return;
    lastWheel=now;step(e.deltaY>=0?1:-1);
  },{capture:true,passive:false});

  document.addEventListener('keydown',e=>{
    if(!isScenes()||detailOpen()||!shell.contains(document.activeElement))return;
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();e.stopImmediatePropagation();step(1)}
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();step(-1)}
    else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();openActiveDetail()}
  },true);

  document.addEventListener('mousemove',e=>{
    if(!isScenes()||detailOpen()||!matchMedia('(pointer:fine)').matches)return;
    const label=$('.cursor span');if(!label)return;
    if(!shell.contains(e.target)){root.removeAttribute('data-scene-cursor');return}
    const over=progress<.02&&overObject(e.clientX,e.clientY);
    root.dataset.sceneCursor=over?'view':'drag';
    label.textContent=over?'VIEW':'DRAG';
  },true);

  /* ---------- lifecycle ---------- */
  function activate(){
    injectStudioOption();ensureStyles();ensureScene();
    if(isScenes()){
      scene.hidden=false;
      rebuild();
      root.dataset.anchorScenes='ready';
      root.dataset.orbitalChoreography='anchor-scenes-v1';
    }else{
      if(scene)scene.hidden=true;
      tween?.kill?.();dragging=false;
      gsap.set(copy,{opacity:1});
      if(eyebrowEl)gsap.set(eyebrowEl,{opacity:1});
      root.removeAttribute('data-scene-cursor');
      delete root.dataset.anchorScenes;delete root.dataset.sceneProgress;
      root.style.removeProperty('--sc-accent');
    }
  }

  new MutationObserver(()=>{
    if(!isScenes())return;
    const idx=counterIndex();
    commitText(idx);
    if(baseSyncTarget!==null){
      if(idx===baseSyncTarget){baseSyncTarget=null;clearTimeout(baseSyncTimer)}
      return;
    }
    /* A gesture in flight owns the scene: the index commits at the crossover, so the
       counter changes mid-transition and the observer must not read its own commit
       as an external change. */
    if(dragging||tween?.isActive()||progress>.001)return;
    if(idx!==normalize(restIndex))goTo(idx);
  }).observe($('#dish-counter')||copy,{subtree:true,childList:true,characterData:true});

  new MutationObserver(()=>{
    if(!isScenes()||detailOpen())return;
    /* Committing the index makes the Class 06 product layer rebuild #orbit-stage;
       rebuilding here mid-gesture would reset progress and abort the swap. */
    setTimeout(()=>{
      if(!isScenes()||detailOpen())return;
      if(dragging||tween?.isActive()||progress>.001){pendingRebuild=true;return}
      rebuild();
    },40);
  }).observe(baseStage,{childList:true});

  window.addEventListener('restaurant:motion-change',()=>setTimeout(activate,0));
  window.addEventListener('restaurant:dish-detail-open',()=>{dragging=false;tween?.kill?.()});
  window.addEventListener('restaurant:dish-detail-close',()=>setTimeout(()=>{if(isScenes())activate()},260));
  reduced.addEventListener?.('change',activate);
  addEventListener('resize',()=>{if(isScenes())render(progress)});

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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,320));
  else setTimeout(boot,320);

  window.RestaurantAnchorScenes={
    MODE,activate,rebuild,step,goTo,complete,cancel,
    setProgress(p,dir){if(dir&&dir!==direction){direction=dir;refreshPair()}tween?.kill?.();setProgress(p)},
    state:()=>({progress,direction,restIndex:normalize(restIndex),outIndex,inIndex,committed,
      mode:root.dataset.orbitalMotion,dishes:count(),
      scenes:$$('.sc-scene').filter(e=>e.dataset.kind==='scene').length})
  };
})();
