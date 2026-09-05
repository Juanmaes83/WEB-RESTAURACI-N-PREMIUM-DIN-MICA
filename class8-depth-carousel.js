/* CLASS 08 · PROJECT 01 — CINEMATIC DEPTH CAROUSEL · VISUAL DIRECTION V3
   Additive Motion Engine preset. Studio → Motion → "Depth Carousel".

   Architecture (unchanged since V1, proven by Class 07 Editorial Flow):
     · The Orbital Engine (app-v4 / class4-runtime-guard) is the AUTHORITATIVE dish
       state; #dish-counter is the single source of truth for the active index.
     · This engine owns only the visible choreography. #orbit-stage stays hidden.
     · Navigation is committed by clicking the real base dish, so copy, detail, the
       Class 06 product layer, Studio and persistence keep working untouched.

   V3 is an art-direction pass. What changed against V2:
     · ASSETS — dish.depthCarousel.asset now points at food segmented off the
       porcelain, so the collection has real silhouettes instead of six discs.
     · BACKGROUND — two PURE colour worlds. B is clipped over A along a moving
       diagonal edge driven by the gesture. No opacity crossfade, no RGB mud.
     · LETTERING — both words live at full strength on opposite sides of that same
       edge, so the transition is continuous and never a soup or a hole.
     · REAL Z — translateZ per slot inside a shared CSS perspective, so plates
       genuinely swap depth as they pass each other.
     · DECOR — foregroundDecor / backgroundDecor are rendered, not just declared,
       each on its own parallax rate; the near layer crosses in front of the hero.
     · COPY — a reserved safe zone with a scrim, above the products, always legible.
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
     DEPTH TRACK — asymmetric, and now with a real Z axis.
     x/y percentages of the shell · s scale · o opacity · b blur
     rz rotateZ · rx rotateX · z translateZ (px, inside perspective:1500px)

     x/y are where the object actually LANDS ON SCREEN. Perspective pulls anything
     with negative Z toward the vanishing point, so a raw translate would compress
     the whole composition inwards and nothing would ever reach the frame edge;
     renderAt() divides out that factor before positioning. Apparent size is
     s * P/(P-z): the hero reads ~2x its neighbours because it is nearer the camera,
     not because it is a bigger sprite. Left and right are NOT mirrored.
  --------------------------------------------------------------------------- */
  const TRACK_DESKTOP={
    '-3':{x:-16,y: 6,s:.46,o:0,  b:2.6,rz:-16,rx:44,z:-760},
    '-2':{x:  9,y:16,s:.56,o:.48,b:1.8,rz:-11,rx:38,z:-560},
    '-1':{x: 43,y:28,s:.74,o:.95,b:.6, rz: -6,rx:26,z:-250},
    '0' :{x: 62,y:62,s:1.16,o:1, b:0,  rz:  0,rx:12,z: 150},
    '1' :{x: 83,y:20,s:.72,o:.95,b:.7, rz:  9,rx:30,z:-210},
    '2' :{x:104,y:76,s:.60,o:.52,b:1.6,rz: 15,rx:36,z:-500},
    '3' :{x:124,y:86,s:.48,o:0,  b:2.6,rz: 20,rx:42,z:-760}
  };
  const TRACK_MOBILE={
    '-3':{x:-30,y:10,s:.48,o:0,  b:2.4,rz:-17,rx:40,z:-720},
    '-2':{x: -8,y:18,s:.58,o:.44,b:1.8,rz:-13,rx:36,z:-540},
    '-1':{x: 18,y:28,s:.76,o:.90,b:.6, rz: -7,rx:26,z:-240},
    '0' :{x: 52,y:64,s:1.14,o:1, b:0,  rz:  0,rx:11,z: 140},
    '1' :{x: 88,y:22,s:.74,o:.90,b:.7, rz: 10,rx:28,z:-205},
    '2' :{x:116,y:76,s:.60,o:.46,b:1.6,rz: 16,rx:34,z:-480},
    '3' :{x:138,y:88,s:.50,o:0,  b:2.4,rz: 21,rx:40,z:-720}
  };

  /* Layer rates. 1.00 is the plate rail. Near decor overtakes it, far layers lag. */
  const RATE={backdrop:.20,decorBack:.32,word:.52,decorFront:1.30};
  const SKEW=7;             /* wipe edge slant, % of width */
  const PERSPECTIVE=1500;   /* must match .orbit-shell perspective in styles-v8.css */

  let scene=null,platesHost=null,wordsHost=null,backdrop=null,bgA=null,bgB=null,edgeEl=null;
  let decorBack=null,decorFront=null,copyEl=null,priceEl=null,ingEl=null,dotsEl=null,eyebrowEl=null;
  let position=0,activeIndex=0,snapTween=null,breathTween=null;
  let dragging=false,pointerId=null,startX=0,startPos=0,lastX=0,lastT=0,velocity=0,moved=false;
  let lastWheel=0,internalPass=false,booted=false,meta=new Map();
  let baseSyncTarget=null,baseSyncTimer=null,bgAIndex=null,bgBIndex=null;

  const isDepth=()=>root.dataset.orbitalMotion===MODE;
  const detailOpen=()=>root.dataset.dishDetail==='open'||document.body.classList.contains('detail-open');
  const isMobile=()=>innerWidth<820;
  const baseDishes=()=>$$('.orbit-dish',baseStage);
  const count=()=>baseDishes().length;
  const normalize=(n,total=count())=>total?((n%total)+total)%total:0;
  const counterIndex=()=>{const n=parseInt($('#dish-counter')?.textContent||'',10);return Number.isFinite(n)?Math.max(0,n-1):0};
  const plates=()=>platesHost?$$('.dc-plate',platesHost):[];
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const smooth=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t)};

  const hex2rgb=h=>{const v=String(h||'').replace('#','');const n=v.length===3?v.split('').map(c=>c+c).join(''):v;const i=parseInt(n,16);return Number.isFinite(i)?[i>>16&255,i>>8&255,i&255]:[216,255,79]};
  const rgb2css=c=>`rgb(${c.map(v=>Math.round(v)).join(',')})`;
  const mixRgb=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const lighten=(h,t)=>rgb2css(mixRgb(hex2rgb(h),[255,255,255],t));

  /* ---------- data: the real dish model, extended, never duplicated ---------- */
  const firstWord=name=>String(name||'').trim().split(/[\s/·—-]+/).filter(Boolean)[0]||'DISH';
  function defaultMeta(dish,i){
    const fb=FALLBACK[i%FALLBACK.length];
    return {asset:'',word:firstWord(dish?.name),accent:dish?.editorialFlow?.color||fb.accent,
      backgroundColor:fb.backgroundColor,backgroundGradient:'',background:'',
      foregroundDecor:'',backgroundDecor:''};
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
  function backgroundFor(info){
    if(info.background)return `url("${info.background}") center/cover no-repeat`;
    if(info.backgroundGradient)return info.backgroundGradient;
    const a=hex2rgb(info.accent),base=info.backgroundColor||'#0a0a08';
    const glow=(t,alpha)=>`rgba(${a.map(v=>Math.round(v*t)).join(',')},${alpha})`;
    return [
      `radial-gradient(ellipse 82% 66% at 60% 22%, ${glow(1,.48)} 0%, transparent 64%)`,
      `radial-gradient(ellipse 66% 58% at 8% 84%, ${glow(.66,.42)} 0%, transparent 68%)`,
      `radial-gradient(ellipse 92% 84% at 92% 96%, ${glow(.46,.32)} 0%, transparent 72%)`,
      `linear-gradient(168deg, ${base} 0%, #06060a 74%)`
    ].join(',');
  }

  /* ---------- studio + styles ---------- */
  function injectStudioOption(){
    const select=$('#motion-orbital-style');
    if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const o=document.createElement('option');o.value=MODE;o.textContent='Depth Carousel';select.appendChild(o);
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
      bgA=document.createElement('div');bgA.className='dc-bg dc-bg-a';
      bgB=document.createElement('div');bgB.className='dc-bg dc-bg-b';
      edgeEl=document.createElement('div');edgeEl.className='dc-wipe-edge';
      const veil=document.createElement('div');veil.className='dc-vignette';
      const scrim=document.createElement('div');scrim.className='dc-scrim';
      backdrop.append(bgA,bgB,edgeEl,veil,scrim);
      section.insertBefore(backdrop,section.firstChild);
      bgAIndex=bgBIndex=null;
    }
    if(!scene?.isConnected){
      scene=document.createElement('div');scene.className='dc-scene';scene.setAttribute('aria-hidden','true');
      decorBack=document.createElement('div');decorBack.className='dc-decor dc-decor-back';
      wordsHost=document.createElement('div');wordsHost.className='dc-words';
      platesHost=document.createElement('div');platesHost.className='dc-plates';
      decorFront=document.createElement('div');decorFront.className='dc-decor dc-decor-front';
      scene.append(decorBack,wordsHost,platesHost,decorFront);
      shell.appendChild(scene);
    }
    eyebrowEl=$('.dc-eyebrow',section);
    if(!eyebrowEl){
      eyebrowEl=document.createElement('p');eyebrowEl.className='dc-eyebrow';
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

  function decorNode(src,cls,index){
    const el=document.createElement('div');
    el.className=cls;el.dataset.index=String(index);
    if(src)el.style.backgroundImage=`url("${src}")`;
    else el.dataset.empty='1';
    return el;
  }

  function rebuild(){
    ensureScene();
    if(detailOpen())return;
    const items=baseDishes();
    if(!items.length)return;

    platesHost.innerHTML='';wordsHost.innerHTML='';decorBack.innerHTML='';decorFront.innerHTML='';
    items.forEach((base,i)=>{
      const info=dishFor(i);
      const src=info.asset||$('img',base)?.getAttribute('src')||info.dish?.image||'';
      if(!src)return;

      const btn=document.createElement('button');
      btn.type='button';btn.className=`dc-plate ${info.asset?'is-free':'is-framed'}`;btn.tabIndex=-1;
      btn.dataset.id=base.dataset.id||'';btn.dataset.index=String(i);
      const img=document.createElement('img');
      img.src=src;img.alt='';img.decoding='async';img.draggable=false;
      img.onerror=()=>{const f=$('img',base)?.getAttribute('src');if(f&&img.src!==f){img.src=f;btn.className='dc-plate is-framed'}};
      btn.appendChild(img);
      platesHost.appendChild(btn);

      /* Each word gets a full-width clip wrapper. Clipping the wrapper rather than
         the text lets both words share one edge expressed in scene coordinates. */
      const wrap=document.createElement('div');
      wrap.className='dc-word-clip';wrap.dataset.index=String(i);
      const word=document.createElement('div');
      word.className='dc-word';word.textContent=info.word;
      word.style.color=lighten(info.accent,.46);
      wrap.appendChild(word);
      wordsHost.appendChild(wrap);

      decorBack.appendChild(decorNode(info.backgroundDecor,'dc-decor-item',i));
      decorFront.appendChild(decorNode(info.foregroundDecor,'dc-decor-item',i));
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
    bgAIndex=bgBIndex=null;
    activeIndex=counterIndex();position=activeIndex;
    renderAt(position);commitText(activeIndex);
  }

  /* ---------- track sampling ---------- */
  function sampleTrack(distance){
    const table=isMobile()?TRACK_MOBILE:TRACK_DESKTOP;
    const d=clamp(distance,-3,3);
    const lo=Math.floor(d),hi=Math.ceil(d),t=d-lo;
    const A=table[String(lo)],B=table[String(hi)]||A;
    const out={};
    for(const k of ['x','y','s','o','b','rz','rx','z'])out[k]=lerp(A[k],B[k],t);
    return out;
  }
  function wrapped(i,pos,total){let d=i-pos;while(d>total/2)d-=total;while(d<-total/2)d+=total;return d}

  /* ---------- the frame ---------- */
  function renderAt(pos){
    const list=plates(),n=list.length;
    if(!n)return;
    const W=shell.clientWidth,H=shell.clientHeight,mobile=isMobile();
    const T=mobile?TRACK_MOBILE:TRACK_DESKTOP;
    const stepPx=(T['1'].x-T['0'].x)/100*W;

    const lo=Math.floor(pos),t=pos-lo;

    /* --- background: two pure worlds, B clipped over A along a moving edge --- */
    const aIdx=normalize(lo),bIdx=normalize(lo+1);
    if(aIdx!==bgAIndex){bgA.style.background=backgroundFor(dishFor(aIdx));bgAIndex=aIdx}
    if(bIdx!==bgBIndex){bgB.style.background=backgroundFor(dishFor(bIdx));bgBIndex=bIdx}
    const edge=(1-t)*100;                       /* % of width still owned by A */
    const e1=edge-SKEW, e2=edge+SKEW;           /* slanted leading edge */
    bgB.style.clipPath=`polygon(${e1}% 0, 200% 0, 200% 100%, ${e2}% 100%)`;
    gsap.set(bgA,{x:-t*stepPx*RATE.backdrop});
    gsap.set(bgB,{x:(1-t)*stepPx*RATE.backdrop});
    if(edgeEl){
      const show=t>0.012&&t<0.988;
      edgeEl.style.opacity=show?String(0.5*Math.sin(Math.PI*t)+0.12):'0';
      edgeEl.style.left=`${edge}%`;
    }

    /* --- plates --- */
    list.forEach((plate,i)=>{
      const d=wrapped(i,pos,n),slot=sampleTrack(d);
      const seam=clamp((2.85-Math.abs(d))/.45,0,1);
      const o=slot.o*seam;
      const visible=o>.02;
      const arc=Math.sin(clamp(d,-3,3)*Math.PI/1.6)*(mobile?7:16);
      const near=1-clamp(Math.abs(d)/2.4,0,1);
      const shadow=visible?` drop-shadow(0 ${(14+near*30).toFixed(0)}px ${(18+near*30).toFixed(0)}px rgba(0,0,0,${(0.28+near*0.28).toFixed(2)}))`:'';
      /* undo the perspective compression so slot.x / slot.y mean screen position */
      const f=PERSPECTIVE/(PERSPECTIVE-slot.z);
      const sx=(50+(slot.x-50)/f)/100*W;
      const sy=(50+(slot.y-50)/f)/100*H+arc/f;
      gsap.set(plate,{
        xPercent:-50,yPercent:-50,
        x:sx, y:sy, z:slot.z,
        scale:slot.s, rotation:slot.rz, rotationX:slot.rx,
        opacity:o,
        filter:visible?`blur(${slot.b.toFixed(2)}px) brightness(${(0.58+near*0.50).toFixed(3)})${shadow}`:'none',
        zIndex:Math.round(300+slot.z/4),
        pointerEvents:o>.35?'auto':'none'
      });
      plate.classList.toggle('is-hero',Math.abs(d)<.42);

      /* --- lettering: A left of the edge, B right of it, both at full strength --- */
      const wrap=wordsHost.children[i];
      if(wrap){
        const isA=i===aIdx, isB=i===bIdx;
        if(isA||isB){
          wrap.style.display='block';
          wrap.style.clipPath=isA
            ? `polygon(-100% 0, ${e1}% 0, ${e2}% 100%, -100% 100%)`
            : `polygon(${e1}% 0, 200% 0, 200% 100%, ${e2}% 100%)`;
          /* Both words are centred, so a seam through the middle would read as one
             broken word. Push them apart while the seam crosses — maximum at 50%,
             zero at both ends — so mid-gesture you read two words, not one. */
          const sep=Math.sin(Math.PI*t)*W*0.09;
          const base=isA?-t*stepPx*RATE.word:(1-t)*stepPx*RATE.word;
          gsap.set(wrap,{x:base+(isA?-sep:sep),opacity:1});
        }else wrap.style.display='none';
      }

      /* --- decor: own rails, near layer overtakes the plates --- */
      const back=decorBack.children[i], front=decorFront.children[i];
      if(back&&!back.dataset.empty){
        const bo=clamp(1.1-Math.abs(d)*1.1,0,1);
        gsap.set(back,{xPercent:-50,yPercent:-50,
          x:(i%2?.88:.72)*W-d*stepPx*RATE.decorBack, y:(i%2?.14:.30)*H,
          scale:.9,opacity:bo*.42,rotation:d*6});
      }
      if(front&&!front.dataset.empty){
        const fo=clamp(1.15-Math.abs(d)*1.15,0,1);
        gsap.set(front,{xPercent:-50,yPercent:-50,
          x:(i%2?.86:.70)*W-d*stepPx*RATE.decorFront, y:(i%2?.84:.92)*H,
          scale:1.15,opacity:fo,rotation:-d*14});
      }
    });

    /* --- accent: hold A, cross late and fast, hold B. No long RGB mud. --- */
    const k=smooth(.44,.56,t);
    root.style.setProperty('--dc-accent',
      rgb2css(mixRgb(hex2rgb(dishFor(lo).accent),hex2rgb(dishFor(lo+1).accent),k)));

    /* --- copy: near-invisible through the crossover, full at rest --- */
    const dip=1-smooth(.10,.42,Math.abs(pos-Math.round(pos)))*.90;
    gsap.set(copy,{opacity:dip});
    if(eyebrowEl)gsap.set(eyebrowEl,{opacity:.5+dip*.5});
  }

  function commitText(index){
    const info=dishFor(index),d=info.dish||{};
    if(priceEl)priceEl.textContent=d.price||'';
    if(ingEl)ingEl.textContent=d.ingredients||d.meta||'';
    if(dotsEl)$$('.dc-dot',dotsEl).forEach((dot,i)=>dot.setAttribute('aria-current',String(i===normalize(index))));
  }

  /* ---------- idle ---------- */
  function heroImg(){const h=plates()[normalize(activeIndex)];return h?$('img',h):null}
  function stopBreath(){breathTween?.kill?.();breathTween=null;const img=heroImg();if(img)gsap.set(img,{y:0,scale:1})}
  function startBreath(){
    stopBreath();
    if(!isDepth()||reduced.matches||detailOpen()||dragging)return;
    const img=heroImg();if(!img)return;
    breathTween=gsap.to(img,{y:-9,scale:1.014,duration:2.8,ease:'sine.inOut',yoyo:true,repeat:-1});
  }

  /* ---------- commit back to the Orbital Engine ---------- */
  function passBaseClick(el){internalPass=true;try{el?.click()}finally{queueMicrotask(()=>{internalPass=false})}}
  function syncBaseTo(index){
    const target=normalize(index);
    clearTimeout(baseSyncTimer);
    if(counterIndex()===target){baseSyncTarget=null;return}
    /* The base engine tweens to the target and its counter SWEEPS through every
       intermediate index. Without this latch the counter observer would read those
       intermediate values as an external change and chase them back. */
    baseSyncTarget=target;
    baseSyncTimer=setTimeout(()=>{baseSyncTarget=null},1800);
    const el=baseDishes()[target];
    /* Programmatic clicks carry clientX/Y 0, so the Class 06 hero bridge ignores them. */
    if(el)passBaseClick(el);
  }
  function openActiveDetail(){
    const base=baseDishes()[normalize(activeIndex)];
    if(!base)return;
    alignBaseToHero(base);
    if(typeof window.RestaurantClass6Detail?.open==='function')window.RestaurantClass6Detail.open(base);
    else passBaseClick(base);
  }
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
    snapTween?.kill?.();stopBreath();
    const state={p:position},dist=Math.abs(target-position);
    const dur=reduced.matches?.01:(duration??Math.min(1.15,.46+dist*.30));
    const landed=normalize(Math.round(target));
    snapTween=gsap.to(state,{
      p:target,duration:dur,ease:reduced.matches?'none':'power3.out',
      onUpdate(){position=state.p;renderAt(position);trackActive()},
      onComplete(){
        position=target;renderAt(position);setActive(landed);commitText(counterIndex());
        root.dataset.orbitalChoreography='depth-carousel-v3';startBreath();
      }
    });
    syncBaseTo(landed);
  }
  /* activeIndex tracks the VISUAL hero. It deliberately does not drive the text:
     price and ingredients follow the base engine's counter, so they can never
     disagree with the title and description the base engine writes. */
  function setActive(index){const next=normalize(index);if(next!==activeIndex)activeIndex=next}
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
    const offset=clamp(-(velocity*180)/dragUnit(),-2,2);
    snapTo(Math.round(position+offset));
  }

  /* ---------- input ownership (capture phase, guarded by mode) ---------- */
  document.addEventListener('pointerdown',e=>{
    if(!isDepth()||!shell.contains(e.target))return;
    /* Exclusive ownership: app-v4, Elegant and Urban each bind their own shell drag.
       Two drag owners on one surface is the Class 04 failure mode. */
    e.stopImmediatePropagation();onDown(e);
  },true);
  document.addEventListener('pointermove',e=>{if(!dragging)return;e.stopImmediatePropagation();onMove(e)},true);
  document.addEventListener('pointerup',e=>{if(!dragging)return;e.stopImmediatePropagation();onUp(e)},true);
  document.addEventListener('pointercancel',e=>{if(!dragging)return;e.stopImmediatePropagation();dragging=false;pointerId=null;delete root.dataset.depthDrag;snapTo(Math.round(position))},true);

  /* Runs before the Class 06 hero bridge (document capture precedes .orbit-shell
     capture), so a drag release is never mistaken for an "open the dish" click. */
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
    const plate=e.target.closest('.dc-plate')||plateAtPoint(e.clientX,e.clientY);
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

  /* Objects live in a preserve-3d context under a pointer-events:none scene, and
     Chromium will not hit-test them there however the property is re-enabled. So
     selection is geometric, the same approach class6-detail-bridge already uses:
     the visible object under the pointer, nearest to the camera. */
  function plateAtPoint(x,y){
    let best=null,bestZ=-Infinity;
    for(const p of plates()){
      if(+getComputedStyle(p).opacity<.35)continue;
      const r=p.getBoundingClientRect();
      if(x<r.left||x>r.right||y<r.top||y>r.bottom)continue;
      const z=+(gsap.getProperty(p,'z')||0);
      if(z>bestZ){bestZ=z;best=p}
    }
    return best;
  }

  /* ---------- cursor: part of this scene, not of the Orbital one ---------- */
  const cursorLabel=()=>$('.cursor span');
  document.addEventListener('mousemove',e=>{
    if(!isDepth()||detailOpen()||!matchMedia('(pointer:fine)').matches)return;
    const label=cursorLabel();if(!label)return;
    if(!shell.contains(e.target)){root.removeAttribute('data-depth-cursor');return}
    const hit=plateAtPoint(e.clientX,e.clientY);
    const over=hit&&Number(hit.dataset.index)===normalize(activeIndex);
    root.dataset.depthCursor=over?'view':'drag';
    label.textContent=over?'VIEW':'DRAG';
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
      root.dataset.orbitalChoreography='depth-carousel-v3';
    }else{
      if(scene)scene.hidden=true;
      if(backdrop)backdrop.hidden=true;
      snapTween?.kill?.();stopBreath();dragging=false;
      gsap.set(copy,{opacity:1});
      if(eyebrowEl)gsap.set(eyebrowEl,{opacity:1});
      root.removeAttribute('data-depth-cursor');
      delete root.dataset.depthCarousel;
      root.style.removeProperty('--dc-accent');
    }
  }

  new MutationObserver(()=>{
    if(!isDepth())return;
    const idx=counterIndex();
    commitText(idx);
    if(baseSyncTarget!==null){
      if(idx===baseSyncTarget){baseSyncTarget=null;clearTimeout(baseSyncTimer)}
      return;
    }
    if(dragging||snapTween?.isActive())return;
    if(idx!==activeIndex)goTo(idx);
  }).observe($('#dish-counter')||copy,{subtree:true,childList:true,characterData:true});

  new MutationObserver(()=>{
    /* app-v4 moves the real dish node into #detail-visual while the detail is open;
       rebuilding then would leave the scene one plate short. */
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
      freeObjects:plates().filter(p=>p.classList.contains('is-free')).length,
      decor:{back:$$('.dc-decor-back .dc-decor-item:not([data-empty])').length,
             front:$$('.dc-decor-front .dc-decor-item:not([data-empty])').length}})
  };
})();
