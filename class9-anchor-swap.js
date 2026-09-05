/* CLASS 09 · PROJECT 02 — ANCHOR SWAP / SPLIT DROP
   Additive Motion Engine preset. Studio → Motion → "Anchor Swap".

   Contract inherited from Project 01 and deliberately unchanged:
     · The Orbital Engine (app-v4 / class4-runtime-guard) is the AUTHORITATIVE dish
       state; #dish-counter is the single source of truth for the active index.
     · This engine owns only the visible choreography. #orbit-stage stays hidden.
     · Navigation is committed by clicking the real base dish, so copy, detail, the
       Class 06 product layer, Studio and persistence keep working untouched.
     · No second index, no second dish model, no duplicated detail or persistence.

   What this preset IS, and what it is not:
     It is not a carousel. There is one place on screen — the hand — and it never
     moves. The product inside it is replaced while the world around it mutates.
     During the middle of a gesture the OUTGOING and INCOMING products coexist, and
     so do the OLD and NEW colour worlds, split by a moving edge.

   Progress model:
     progress runs 0 → 1 and is driven directly by the drag. 0.5 is the real
     crossover, not a threshold that fires at the end. Dragging back reverses it.
     On release the gesture either completes (progress → 1, index committed) or
     cancels (progress → 0, nothing committed).
*/
(() => {
  'use strict';
  if(!window.gsap)return;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const shell=$('.orbit-shell'), baseStage=$('#orbit-stage'), copy=$('.dish-copy'), controls=$('.orbit-controls');
  const section=$('.orbital-section');
  if(!shell||!baseStage||!copy||!section)return;

  const MODE='anchor-swap';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  const HAND={
    back:'assets/anchor-swap/runtime/anchor-hand-back.png',
    front:'assets/anchor-swap/runtime/anchor-hand-front.png',
    /* measured by scripts/anchor-first-proof.mjs on the real alpha, not guessed:
       the pocket between thumb and fingertips, as % of the hand canvas */
    cup:{x:51.5,y:30.1,w:46.4,h:22.4},
    ratio:1122/1402
  };
  const FALLBACK=[
    {accent:'#ff6a3c',backgroundColor:'#1e0a05'},{accent:'#4f8dff',backgroundColor:'#050f22'},
    {accent:'#b9e24d',backgroundColor:'#101c07'},{accent:'#34d3c6',backgroundColor:'#041d1d'},
    {accent:'#ef5b7e',backgroundColor:'#1d0611'},{accent:'#ffc23d',backgroundColor:'#201202'}
  ];

  /* Layer rates. The anchor is the one thing that does NOT travel. */
  const RATE={backdrop:.20,decorBack:.35,word:.55,product:1,decorFront:1.20,anchor:0};
  const COMMIT_IN=.55, COMMIT_OUT=.45;   /* hysteresis around the crossover */
  const RELEASE=.42;                     /* below this a release cancels */

  let scene=null,backdrop=null,bgA=null,bgB=null,anchorWrap=null,anchorBack=null,anchorFront=null;
  let productOut=null,productIn=null,decorBack=null,decorFront=null,wordEl=null;
  let priceEl=null,ingEl=null,dotsEl=null,eyebrowEl=null,copyEl=null;
  let restIndex=0,progress=0,direction=1,committed=false;
  let dragging=false,pointerId=null,startX=0,startY=0,lastY=0,lastT=0,velocity=0,moved=false;
  let tween=null,breath=null,booted=false,internalPass=false,meta=new Map();
  let baseSyncTarget=null,baseSyncTimer=null,lastWheel=0,pendingRebuild=false;

  const isAnchor=()=>root.dataset.orbitalMotion===MODE;
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

  /* ---------- data: the same dish model Project 01 already extends ---------- */
  const firstWord=n=>String(n||'').trim().split(/[\s/·—-]+/).filter(Boolean)[0]||'DISH';
  function defaultMeta(dish,i){
    const fb=FALLBACK[i%FALLBACK.length];
    return {asset:'',word:firstWord(dish?.name),accent:dish?.editorialFlow?.color||fb.accent,
      backgroundColor:fb.backgroundColor,foregroundDecor:'',backgroundDecor:''};
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
  function productSrc(index){
    const info=dishFor(index);
    return info.asset||$('img',baseDishes()[normalize(index)])?.getAttribute('src')||info.dish?.image||'';
  }
  function worldFor(info){
    const a=hex2rgb(info.accent),base=info.backgroundColor||'#0a0a08';
    const glow=(t,alpha)=>`rgba(${a.map(v=>Math.round(v*t)).join(',')},${alpha})`;
    return [
      `radial-gradient(ellipse 74% 58% at 62% 26%, ${glow(1,.46)} 0%, transparent 64%)`,
      `radial-gradient(ellipse 62% 54% at 12% 84%, ${glow(.62,.40)} 0%, transparent 68%)`,
      `linear-gradient(172deg, ${base} 0%, #06060a 76%)`
    ].join(',');
  }

  /* ---------- studio + styles ---------- */
  function injectStudioOption(){
    const select=$('#motion-orbital-style');
    if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const o=document.createElement('option');o.value=MODE;o.textContent='Anchor Swap';select.appendChild(o);
    }
    return true;
  }
  function ensureStyles(){
    if($('link[data-anchor-swap-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v9.css';l.dataset.anchorSwapStyles='1';
    document.head.appendChild(l);
  }

  /* ---------- scene ---------- */
  function ensureScene(){
    if(!backdrop?.isConnected){
      backdrop=document.createElement('div');backdrop.className='as-backdrop';backdrop.setAttribute('aria-hidden','true');
      bgA=document.createElement('div');bgA.className='as-bg as-bg-a';
      bgB=document.createElement('div');bgB.className='as-bg as-bg-b';
      const veil=document.createElement('div');veil.className='as-vignette';
      const scrim=document.createElement('div');scrim.className='as-scrim';
      backdrop.append(bgA,bgB,veil,scrim);
      section.insertBefore(backdrop,section.firstChild);
    }
    if(!scene?.isConnected){
      scene=document.createElement('div');scene.className='as-scene';scene.setAttribute('aria-hidden','true');

      decorBack=document.createElement('div');decorBack.className='as-decor as-decor-back';
      wordEl=document.createElement('div');wordEl.className='as-word';
      anchorWrap=document.createElement('div');anchorWrap.className='as-anchor';

      anchorBack=document.createElement('img');anchorBack.className='as-anchor-back';anchorBack.src=HAND.back;anchorBack.alt='';
      productOut=document.createElement('img');productOut.className='as-product as-product-out';productOut.alt='';
      productIn=document.createElement('img');productIn.className='as-product as-product-in';productIn.alt='';
      anchorFront=document.createElement('img');anchorFront.className='as-anchor-front';anchorFront.src=HAND.front;anchorFront.alt='';
      /* THE contract of this preset: the product lives between the two hand layers. */
      anchorWrap.append(anchorBack,productOut,productIn,anchorFront);

      decorFront=document.createElement('div');decorFront.className='as-decor as-decor-front';
      scene.append(decorBack,wordEl,anchorWrap,decorFront);
      shell.appendChild(scene);
    }
    eyebrowEl=$('.as-eyebrow',section);
    if(!eyebrowEl){
      eyebrowEl=document.createElement('p');eyebrowEl.className='as-eyebrow';
      eyebrowEl.innerHTML='<span>Signature collection</span><span class="as-eyebrow-hint">Arrastra para cambiar de plato</span>';
      section.insertBefore(eyebrowEl,shell);
    }
    if(!$('.as-copy',copy)){
      copyEl=document.createElement('div');copyEl.className='as-copy';
      copyEl.innerHTML='<span class="as-price"></span><span class="as-ingredients"></span>';
      const explore=$('#explore-dish');
      explore?copy.insertBefore(copyEl,explore):copy.appendChild(copyEl);
    }
    priceEl=$('.as-price',copy);ingEl=$('.as-ingredients',copy);
    if(controls&&!$('.as-dots',controls)){
      dotsEl=document.createElement('div');dotsEl.className='as-dots';
      dotsEl.setAttribute('role','tablist');dotsEl.setAttribute('aria-label','Seleccionar plato');
      controls.appendChild(dotsEl);
    }else dotsEl=$('.as-dots',controls||document);
  }

  function decorGroup(info,layer){
    const g=document.createElement('div');g.className='as-decor-group';
    if(layer==='back'){
      const a=hex2rgb(info.accent);
      const atmo=document.createElement('div');atmo.className='as-atmo';
      atmo.style.background=`radial-gradient(ellipse 56% 48% at 50% 50%, rgba(${a.join(',')},.22) 0%, rgba(${a.map(v=>Math.round(v*.5)).join(',')},.09) 54%, transparent 80%)`;
      g.appendChild(atmo);
    }
    const items=asList(layer==='back'?info.backgroundDecor:info.foregroundDecor);
    const anchors=layer==='back'?[[42,14],[34,44]]:[[46,88],[88,26]];
    items.slice(0,anchors.length).forEach((src,n)=>{
      const el=document.createElement('div');el.className='as-decor-item';
      el.style.backgroundImage=`url("${src}")`;
      el.style.left=`${anchors[n][0]}%`;el.style.top=`${anchors[n][1]}%`;
      g.appendChild(el);
    });
    return g;
  }

  function rebuild(){
    ensureScene();
    if(detailOpen())return;
    if(!count())return;
    restIndex=counterIndex();progress=0;committed=false;
    if(dotsEl&&dotsEl.children.length!==count()){
      dotsEl.innerHTML='';
      baseDishes().forEach((_,i)=>{
        const dot=document.createElement('button');
        dot.type='button';dot.className='as-dot';dot.dataset.index=String(i);
        dot.setAttribute('aria-label',`Plato ${i+1}`);
        dotsEl.appendChild(dot);
      });
    }
    refreshPair();
    render(0);
    commitText(restIndex);
  }

  /* The pair on stage: what is resting, and what would arrive if the gesture
     completed in the current direction. Rebuilt whenever either changes. */
  let outIndex=0,inIndex=0;
  function refreshPair(){
    outIndex=normalize(restIndex);
    inIndex=normalize(restIndex+direction);
    const outSrc=productSrc(outIndex), inSrc=productSrc(inIndex);
    if(productOut.getAttribute('src')!==outSrc)productOut.src=outSrc;
    if(productIn.getAttribute('src')!==inSrc)productIn.src=inSrc;
    bgA.style.background=worldFor(dishFor(outIndex));
    bgB.style.background=worldFor(dishFor(inIndex));
    decorBack.innerHTML='';decorFront.innerHTML='';
    decorBack.append(decorGroup(dishFor(outIndex),'back'),decorGroup(dishFor(inIndex),'back'));
    decorFront.append(decorGroup(dishFor(outIndex),'front'),decorGroup(dishFor(inIndex),'front'));
    wordEl.dataset.out=dishFor(outIndex).word;
    wordEl.dataset.in=dishFor(inIndex).word;
  }

  /* ---------- the frame ---------- */
  function render(p){
    if(!scene)return;
    const H=shell.clientHeight,W=shell.clientWidth,dir=direction;
    const t=clamp(p,0,1);

    /* --- world: B drops in over A, a real split rather than a crossfade --- */
    const edge=t*100, skew=isMobile()?6:9;
    bgB.style.clipPath=dir>0
      ? `polygon(0 -50%, 100% -50%, 100% ${edge+skew}%, 0 ${edge-skew}%)`
      : `polygon(0 ${100-edge+skew}%, 100% ${100-edge-skew}%, 100% 150%, 0 150%)`;
    gsap.set(bgA,{y:t*H*RATE.backdrop*dir*.5});
    gsap.set(bgB,{y:(t-1)*H*RATE.backdrop*dir*.5});

    /* --- products: the outgoing leaves, the incoming arrives, and for most of
           the gesture BOTH are on stage at the same time --- */
    const travel=H*(isMobile()?.62:.58);
    gsap.set(productOut,{y:dir*t*travel,scale:1-t*.14,rotation:dir*t*5,
      opacity:1-smooth(.55,.98,t)});
    gsap.set(productIn,{y:-dir*(1-t)*travel,scale:.86+t*.14,rotation:-dir*(1-t)*5,
      opacity:smooth(.02,.45,t)});

    /* --- anchor: it does not travel. A 3px settle is all it is allowed. --- */
    gsap.set(anchorWrap,{y:Math.sin(Math.PI*t)*(dir>0?3:-3)});

    /* --- decor: own rails, the near one overtaking the product --- */
    const groups=(host,rate)=>{
      const [gOut,gIn]=host.children;
      if(gOut)gsap.set(gOut,{y:dir*t*H*rate*.5,opacity:1-smooth(.35,.85,t)});
      if(gIn)gsap.set(gIn,{y:-dir*(1-t)*H*rate*.5,opacity:smooth(.15,.65,t)});
    };
    groups(decorBack,RATE.decorBack);
    groups(decorFront,RATE.decorFront);

    /* --- lettering: lags the product, hands over at the crossover --- */
    /* One word element, handed over at the crossover. The two ramps overlap around
       0.5 so the lettering never disappears completely mid-gesture. */
    const showIn=t>=.5;
    wordEl.textContent=showIn?wordEl.dataset.in:wordEl.dataset.out;
    const wt=showIn?(t-.5)*2:t*2;
    gsap.set(wordEl,{y:(showIn?-(1-wt)*.5:wt*.5)*H*RATE.word*dir,
      opacity:.42*(showIn?smooth(-.25,.55,wt):1-smooth(.45,1.25,wt))});
    wordEl.style.color=lighten(dishFor(showIn?inIndex:outIndex).accent,.46);

    /* --- accent: hold, cross late and fast, hold. No long RGB mud. --- */
    const k=smooth(.44,.56,t);
    root.style.setProperty('--as-accent',
      rgb2css(mixRgb(hex2rgb(dishFor(outIndex).accent),hex2rgb(dishFor(inIndex).accent),k)));

    /* --- copy: the crossover belongs to the product, the anchor and the worlds --- */
    gsap.set(copy,{opacity:1-smooth(.06,.46,t)*.94+smooth(.54,.94,t)*.94});
    if(eyebrowEl)gsap.set(eyebrowEl,{opacity:.45+ (1-Math.sin(Math.PI*t))*.55});

    root.dataset.anchorProgress=t.toFixed(3);
  }

  function commitText(index){
    const info=dishFor(index),d=info.dish||{};
    if(priceEl)priceEl.textContent=d.price||'';
    if(ingEl)ingEl.textContent=d.ingredients||d.meta||'';
    if(dotsEl)$$('.as-dot',dotsEl).forEach((dot,i)=>dot.setAttribute('aria-current',String(i===normalize(index))));
  }

  /* ---------- idle ---------- */
  function stopBreath(){breath?.kill?.();breath=null;gsap.set(anchorWrap,{scale:1})}
  function startBreath(){
    stopBreath();
    if(!isAnchor()||reduced.matches||detailOpen()||dragging)return;
    breath=gsap.to(anchorWrap,{scale:1.006,duration:3.2,ease:'sine.inOut',yoyo:true,repeat:-1});
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

  /* ---------- progress ---------- */
  function setProgress(p){
    progress=clamp(p,0,1);
    render(progress);
    /* The index commits at the crossover, with hysteresis, so the copy really
       follows the gesture and a reversal un-commits it. */
    if(!committed&&progress>COMMIT_IN){committed=true;syncBaseTo(inIndex)}
    else if(committed&&progress<COMMIT_OUT){committed=false;syncBaseTo(outIndex)}
  }
  function animateProgress(to,onDone){
    tween?.kill?.();
    const s={p:progress};
    const dur=reduced.matches?.01:clamp(Math.abs(to-progress)*.85,.24,.85);
    tween=gsap.to(s,{p:to,duration:dur,ease:reduced.matches?'none':'power3.out',
      onUpdate(){setProgress(s.p)},onComplete(){setProgress(to);onDone?.()}});
  }
  function complete(){
    animateProgress(1,()=>{
      restIndex=normalize(inIndex);
      syncBaseTo(restIndex);
      progress=0;committed=false;pendingRebuild=false;
      refreshPair();render(0);commitText(restIndex);
      root.dataset.orbitalChoreography='anchor-swap-v1';
      startBreath();
    });
  }
  function cancel(){
    animateProgress(0,()=>{
      committed=false;syncBaseTo(restIndex);commitText(restIndex);
      if(pendingRebuild){pendingRebuild=false;rebuild()}
      startBreath();
    });
  }
  function step(dir=1){
    if(!isAnchor()||detailOpen()||!count())return;
    tween?.kill?.();
    if(progress>0&&dir!==direction){cancel();return}
    direction=dir;refreshPair();complete();
  }
  function goTo(index){
    if(!isAnchor()||detailOpen()||!count())return;
    const target=normalize(index);
    if(target===normalize(restIndex))return;
    const n=count();let d=target-normalize(restIndex);
    while(d>n/2)d-=n;while(d<-n/2)d+=n;
    direction=d>=0?1:-1;
    restIndex=normalize(target-direction);
    refreshPair();complete();
  }

  /* ---------- gesture: vertical, continuous, reversible ---------- */
  const dragUnit=()=>shell.clientHeight*(isMobile()?.42:.46);
  function onDown(e){
    if(!isAnchor()||detailOpen()||!count())return;
    if(e.target.closest('.as-dot,#next-dish,#prev-dish,#explore-dish'))return;
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=e.clientX;startY=lastY=e.clientY;
    lastT=e.timeStamp||performance.now();velocity=0;
    tween?.kill?.();stopBreath();
    root.dataset.anchorDrag='1';
    try{shell.setPointerCapture?.(e.pointerId)}catch{}
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    const now=e.timeStamp||performance.now(),dt=Math.max(1,now-lastT);
    velocity=velocity*.6+((e.clientY-lastY)/dt)*.4;
    lastY=e.clientY;lastT=now;
    const dy=e.clientY-startY, dx=e.clientX-startX;
    if(Math.hypot(dx,dy)>7)moved=true;
    const raw=dy/dragUnit();
    const dir=raw>=0?1:-1;
    if(dir!==direction&&progress<.02){direction=dir;refreshPair()}
    setProgress(Math.abs(raw));
  }
  function onUp(e){
    if(!dragging||(pointerId!==null&&e.pointerId!==pointerId))return;
    dragging=false;pointerId=null;
    delete root.dataset.anchorDrag;
    try{shell.releasePointerCapture?.(e.pointerId)}catch{}
    if(!moved){startBreath();return}
    const flung=Math.abs(velocity)>.55&&Math.sign(velocity)===direction;
    (progress>RELEASE||flung)?complete():cancel();
  }

  /* ---------- input ownership (capture phase, guarded by mode) ---------- */
  document.addEventListener('pointerdown',e=>{
    if(!isAnchor()||!shell.contains(e.target))return;
    e.stopImmediatePropagation();onDown(e);
  },true);
  document.addEventListener('pointermove',e=>{if(!dragging)return;e.stopImmediatePropagation();onMove(e)},true);
  document.addEventListener('pointerup',e=>{if(!dragging)return;e.stopImmediatePropagation();onUp(e)},true);
  document.addEventListener('pointercancel',e=>{if(!dragging)return;e.stopImmediatePropagation();dragging=false;pointerId=null;delete root.dataset.anchorDrag;cancel()},true);

  document.addEventListener('click',e=>{
    if(!isAnchor()||internalPass||detailOpen())return;
    const dot=e.target.closest('.as-dot');
    if(dot){e.preventDefault();e.stopImmediatePropagation();goTo(Number(dot.dataset.index));return}
    const nav=e.target.closest('#next-dish,#prev-dish');
    if(nav){e.preventDefault();e.stopImmediatePropagation();step(nav.id==='next-dish'?1:-1);return}
    if(e.target.closest('#explore-dish')){e.preventDefault();e.stopImmediatePropagation();openActiveDetail();return}
    if(!shell.contains(e.target))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(moved){moved=false;return}
    if(progress<.02&&overProduct(e.clientX,e.clientY))openActiveDetail();
  },true);

  document.addEventListener('wheel',e=>{
    if(!isAnchor()||detailOpen()||!shell.contains(e.target))return;
    if(Math.abs(e.deltaY)<4)return;
    e.preventDefault();e.stopImmediatePropagation();
    const now=performance.now();if(now-lastWheel<560)return;
    lastWheel=now;step(e.deltaY>=0?1:-1);
  },{capture:true,passive:false});

  document.addEventListener('keydown',e=>{
    if(!isAnchor()||detailOpen()||!shell.contains(document.activeElement))return;
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();e.stopImmediatePropagation();step(1)}
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();step(-1)}
    else if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();openActiveDetail()}
  },true);

  /* Geometric hit test, for the same reason as Project 01: inside a transformed,
     pointer-events:none scene the DOM will not hit-test these reliably. */
  function overProduct(x,y){
    const r=productOut.getBoundingClientRect();
    return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
  }
  document.addEventListener('mousemove',e=>{
    if(!isAnchor()||detailOpen()||!matchMedia('(pointer:fine)').matches)return;
    const label=$('.cursor span');if(!label)return;
    if(!shell.contains(e.target)){root.removeAttribute('data-anchor-cursor');return}
    const over=progress<.02&&overProduct(e.clientX,e.clientY);
    root.dataset.anchorCursor=over?'view':'drag';
    label.textContent=over?'VIEW':'DRAG';
  },true);

  /* ---------- lifecycle ---------- */
  function activate(){
    injectStudioOption();ensureStyles();ensureScene();
    if(isAnchor()){
      scene.hidden=false;backdrop.hidden=false;
      rebuild();startBreath();
      root.dataset.anchorSwap='ready';
      root.dataset.orbitalChoreography='anchor-swap-v1';
    }else{
      if(scene)scene.hidden=true;
      if(backdrop)backdrop.hidden=true;
      tween?.kill?.();stopBreath();dragging=false;
      gsap.set(copy,{opacity:1});
      if(eyebrowEl)gsap.set(eyebrowEl,{opacity:1});
      root.removeAttribute('data-anchor-cursor');
      delete root.dataset.anchorSwap;delete root.dataset.anchorProgress;
      root.style.removeProperty('--as-accent');
    }
  }

  new MutationObserver(()=>{
    if(!isAnchor())return;
    const idx=counterIndex();
    commitText(idx);
    if(baseSyncTarget!==null){
      if(idx===baseSyncTarget){baseSyncTarget=null;clearTimeout(baseSyncTimer)}
      return;
    }
    /* A gesture in flight owns the scene. The index is committed at the crossover,
       which makes the counter change mid-transition; without this guard the observer
       would read its own commit as an external change and restart the swap. */
    if(dragging||tween?.isActive()||progress>.001)return;
    if(idx!==normalize(restIndex))goTo(idx);
  }).observe($('#dish-counter')||copy,{subtree:true,childList:true,characterData:true});

  new MutationObserver(()=>{
    if(!isAnchor()||detailOpen())return;
    /* Committing the index at the crossover makes the Class 06 product layer
       re-apply and rebuild #orbit-stage. Rebuilding here mid-gesture would reset
       progress to 0 and abort the swap, so a gesture in flight defers it. */
    setTimeout(()=>{
      if(!isAnchor()||detailOpen())return;
      if(dragging||tween?.isActive()||progress>.001){pendingRebuild=true;return}
      rebuild();
    },40);
  }).observe(baseStage,{childList:true});

  window.addEventListener('restaurant:motion-change',()=>setTimeout(activate,0));
  window.addEventListener('restaurant:dish-detail-open',()=>{dragging=false;tween?.kill?.();stopBreath()});
  window.addEventListener('restaurant:dish-detail-close',()=>setTimeout(()=>{if(isAnchor())activate()},260));
  reduced.addEventListener?.('change',activate);
  addEventListener('resize',()=>{if(isAnchor())render(progress)});

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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));
  else setTimeout(boot,300);

  window.RestaurantAnchorSwap={
    MODE,activate,rebuild,step,goTo,complete,cancel,
    setProgress(p,dir){if(dir&&dir!==direction){direction=dir;refreshPair()}tween?.kill?.();setProgress(p)},
    state:()=>({progress,direction,restIndex:normalize(restIndex),outIndex,inIndex,committed,
      mode:root.dataset.orbitalMotion,dishes:count()})
  };
})();
