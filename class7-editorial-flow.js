/* CLASS 07 — EDITORIAL FLOW V2 · video-faithful synchronized choreography.
   Editorial Flow owns the visible transition. The proven Orbital Engine remains the
   authoritative dish/detail state, but its hidden step is started in parallel and its
   real active-index crossover becomes the cue for headline + colour + copy.
*/
(() => {
  'use strict';
  if(!window.gsap)return;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const shell=$('.orbit-shell'),baseStage=$('#orbit-stage'),copy=$('.dish-copy');
  if(!shell||!baseStage||!copy)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const MODE='editorial-flow';
  const PALETTE=['#ef914f','#9270dc','#a9dfa0','#d7b8bb','#6aa7e8','#73c86b','#e9c94c','#e58ca8'];
  const TRACK_DESKTOP={
    '-3':{x:79,y:-21,s:.44,o:.08,b:3.0},'-2':{x:75,y:1,s:.56,o:.28,b:2.1},'-1':{x:70,y:25,s:.76,o:.68,b:.8},
    '0':{x:64,y:50,s:1.10,o:1,b:0},'1':{x:70,y:77,s:.77,o:.72,b:.7},'2':{x:75,y:101,s:.57,o:.31,b:1.9},'3':{x:79,y:123,s:.44,o:.08,b:3.0}
  };
  const TRACK_MOBILE={
    '-3':{x:77,y:-17,s:.47,o:.09,b:2.7},'-2':{x:73,y:4,s:.59,o:.31,b:1.9},'-1':{x:68,y:26,s:.77,o:.70,b:.7},
    '0':{x:61,y:51,s:1.07,o:1,b:0},'1':{x:68,y:78,s:.78,o:.73,b:.6},'2':{x:73,y:101,s:.59,o:.34,b:1.7},'3':{x:77,y:121,s:.46,o:.09,b:2.7}
  };

  let flowStage=null,headline=null,dynamicTitle=null;
  let logicalPosition=0,activeIndex=0,pendingIndex=null,transitioning=false,master=null;
  let inView=false,autoTimer=null,resumeTimer=null,lastWheel=0,pointer=null,internalPass=false;
  let overrides=new Map(),commitFallback=null;
  const originalSaveProject=window.RestaurantStore?.saveProject?.bind(window.RestaurantStore);

  const isFlow=()=>root.dataset.orbitalMotion===MODE;
  const detailOpen=()=>root.dataset.dishDetail==='open'||document.body.classList.contains('detail-open');
  const baseDishes=()=>$$('.orbit-dish',baseStage);
  const count=()=>baseDishes().length;
  const normalize=(n,total=count())=>total?((n%total)+total)%total:0;
  const counterIndex=()=>{const n=parseInt($('#dish-counter')?.textContent||'',10);return Number.isFinite(n)?Math.max(0,n-1):0};
  const defaultEditorial=(id,index,name='')=>({headline:String(name||'Signature plate'),color:PALETTE[index%PALETTE.length]});

  function injectStudioOption(){
    const select=$('#motion-orbital-style');if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const option=document.createElement('option');option.value=MODE;option.textContent='Editorial Flow';select.appendChild(option);
    }
    return true;
  }

  function ensureDefaultMetadata(){
    (window.RestaurantDefaults?.dishes||[]).forEach((d,i)=>{d.editorialFlow={...defaultEditorial(d.id,i,d.name),...(d.editorialFlow||{})}});
  }

  async function loadOverrides(){
    ensureDefaultMetadata();
    let dishes=window.RestaurantDefaults?.dishes||[];
    try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config?.dishes)dishes=saved.config.dishes}catch{}
    overrides=new Map(dishes.map((d,i)=>[d.id,{...defaultEditorial(d.id,i,d.name),...(d.editorialFlow||{})}]));
  }

  function metadataForIndex(index){
    const base=baseDishes()[normalize(index)];
    const id=base?.dataset.id||window.RestaurantDefaults?.dishes?.[normalize(index)]?.id||'';
    const name=base?.querySelector('img')?.alt||window.RestaurantDefaults?.dishes?.[normalize(index)]?.name||'Signature plate';
    return {id,...defaultEditorial(id,index,name),...(overrides.get(id)||{})};
  }

  function wrapPersistence(){
    if(!originalSaveProject||window.RestaurantStore.__editorialFlowWrapped)return;
    window.RestaurantStore.__editorialFlowWrapped=true;
    window.RestaurantStore.saveProject=async payload=>{
      if(payload?.config?.dishes){
        payload.config.dishes.forEach((d,i)=>{d.editorialFlow={...defaultEditorial(d.id,i,d.name),...(d.editorialFlow||{}),...(overrides.get(d.id)||{})}});
      }
      return originalSaveProject(payload);
    };
  }

  async function persistOverrides(){
    if(!originalSaveProject)return;
    try{
      const saved=await window.RestaurantStore.loadProject();if(!saved?.config?.dishes)return;
      saved.config.dishes.forEach((d,i)=>{d.editorialFlow={...defaultEditorial(d.id,i,d.name),...(d.editorialFlow||{}),...(overrides.get(d.id)||{})}});
      await originalSaveProject(saved);
    }catch(err){console.warn('Editorial Flow metadata save skipped',err)}
  }

  function injectStyles(){
    if($('#editorial-flow-styles-v2'))return;
    $('#editorial-flow-styles')?.remove();
    const style=document.createElement('style');style.id='editorial-flow-styles-v2';
    style.textContent=`
      html[data-orbital-motion="${MODE}"] .orbit-ring,
      html[data-orbital-motion="${MODE}"] .orbit-center-mark,
      html[data-orbital-motion="${MODE}"] .orbit-glow{opacity:.10}
      html[data-orbital-motion="${MODE}"] #orbit-stage{visibility:hidden;pointer-events:none}
      .editorial-flow-stage{position:absolute;inset:0;overflow:hidden;z-index:8;pointer-events:none}
      .editorial-flow-plate{position:absolute;left:0;top:0;width:clamp(116px,16vw,230px);aspect-ratio:1;border:0;background:transparent;padding:0;border-radius:50%;pointer-events:auto;cursor:pointer;will-change:transform,opacity,filter;transform-origin:50% 50%}
      .editorial-flow-plate img{width:100%;height:100%;display:block;object-fit:contain;border-radius:50%;filter:drop-shadow(0 20px 26px rgba(0,0,0,.34))}
      .editorial-flow-headline{display:none;margin:0 0 18px;max-width:690px;font-family:var(--font-display,Italiana,serif);font-size:clamp(38px,4.2vw,74px);line-height:.96;letter-spacing:-.035em;color:var(--paper,#ece6da)}
      html[data-orbital-motion="${MODE}"] .editorial-flow-headline{display:block}
      html[data-orbital-motion="${MODE}"] #dish-title{display:none}
      .editorial-flow-prefix,.editorial-flow-suffix{display:block}
      .editorial-flow-dynamic-wrap{display:block;overflow:hidden;min-height:1.02em}
      .editorial-flow-dynamic{display:inline-block;will-change:transform,opacity;color}
      .editorial-flow-studio-fields{grid-column:1/-1;display:grid;grid-template-columns:1fr 140px;gap:12px;padding-top:14px;border-top:1px solid rgba(255,255,255,.09)}
      .editorial-flow-studio-fields .flow-field-title{grid-column:1/-1;margin:0 0 2px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
      @media(max-width:700px){.editorial-flow-plate{width:clamp(92px,27vw,154px)}.editorial-flow-headline{font-size:clamp(32px,10vw,48px)}.editorial-flow-studio-fields{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureStage(){
    if(flowStage?.isConnected)return flowStage;
    flowStage=document.createElement('div');flowStage.className='editorial-flow-stage';flowStage.setAttribute('aria-hidden','true');shell.appendChild(flowStage);return flowStage;
  }

  function ensureHeadline(){
    if(headline?.isConnected)return;
    headline=document.createElement('h3');headline.className='editorial-flow-headline';headline.setAttribute('aria-live','polite');
    headline.innerHTML='<span class="editorial-flow-prefix">Discover</span><span class="editorial-flow-dynamic-wrap"><span class="editorial-flow-dynamic"></span></span><span class="editorial-flow-suffix">Signature plates in motion.</span>';
    copy.insertBefore(headline,$('#dish-meta')||copy.firstChild);dynamicTitle=$('.editorial-flow-dynamic',headline);
  }

  function ensureDishStudioFields(){
    const grid=$('.dish-editor .control-grid');if(!grid||$('#dish-flow-headline'))return;
    const wrap=document.createElement('div');wrap.className='editorial-flow-studio-fields';
    wrap.innerHTML='<p class="flow-field-title">Editorial Flow · vínculo plato / titular</p><label>Título dinámico<input id="dish-flow-headline" maxlength="42"></label><label>Color<input id="dish-flow-color" type="color"></label>';
    grid.appendChild(wrap);
    $('#dish-flow-headline').addEventListener('input',previewStudioMetadata);$('#dish-flow-color').addEventListener('input',previewStudioMetadata);
    $('#dish-save')?.addEventListener('click',()=>setTimeout(saveStudioMetadata,280));
    $('#studio-dish-list')?.addEventListener('click',()=>setTimeout(syncStudioMetadata,0));
    new MutationObserver(()=>syncStudioMetadata()).observe($('#studio-dish-list'),{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    syncStudioMetadata();
  }

  function editorIndex(){const items=$$('.studio-dish-item');const i=items.findIndex(x=>x.classList.contains('active'));return Math.max(0,i)}
  function editorDishId(){
    const i=editorIndex();
    return window.RestaurantDefaults?.dishes?.[i]?.id||baseDishes()[i]?.dataset.id||'';
  }
  async function syncStudioMetadata(){
    const i=editorIndex(),id=editorDishId();if(!id)return;
    let name=window.RestaurantDefaults?.dishes?.[i]?.name||'';
    try{const saved=await window.RestaurantStore?.loadProject?.();name=saved?.config?.dishes?.[i]?.name||name;const m=saved?.config?.dishes?.[i]?.editorialFlow;if(m)overrides.set(id,{...defaultEditorial(id,i,name),...m})}catch{}
    const m={...defaultEditorial(id,i,name),...(overrides.get(id)||{})};
    if($('#dish-flow-headline')&&document.activeElement!==$('#dish-flow-headline'))$('#dish-flow-headline').value=m.headline;
    if($('#dish-flow-color')&&document.activeElement!==$('#dish-flow-color'))$('#dish-flow-color').value=m.color;
  }
  function previewStudioMetadata(){
    const i=editorIndex(),id=editorDishId();if(!id)return;
    const m={headline:$('#dish-flow-headline')?.value||'Signature plate',color:$('#dish-flow-color')?.value||PALETTE[i%PALETTE.length]};overrides.set(id,m);
    if(isFlow()&&normalize(activeIndex)===normalize(i))setHeadline(m,false);
  }
  async function saveStudioMetadata(){previewStudioMetadata();await persistOverrides()}

  function interpolate(a,b,t){return a+(b-a)*t}
  function sampleTrack(distance){
    const table=innerWidth<700?TRACK_MOBILE:TRACK_DESKTOP;
    const d=Math.max(-3,Math.min(3,distance)),lo=Math.floor(d),hi=Math.ceil(d),t=d-lo;
    const A=table[String(lo)],B=table[String(hi)]||A;
    return {x:interpolate(A.x,B.x,t),y:interpolate(A.y,B.y,t),s:interpolate(A.s,B.s,t),o:interpolate(A.o,B.o,t),b:interpolate(A.b,B.b,t)};
  }
  function continuousDistance(i,position,total){let d=i-position;while(d>total/2)d-=total;while(d<-total/2)d+=total;return d}

  function renderAt(position){
    if(!flowStage)return;const plates=$$('.editorial-flow-plate',flowStage),n=plates.length;if(!n)return;
    plates.forEach((plate,i)=>{
      const d=continuousDistance(i,position,n),slot=sampleTrack(d),hero=Math.abs(d)<.45;
      gsap.set(plate,{xPercent:-50,yPercent:-50,x:slot.x/100*shell.clientWidth,y:slot.y/100*shell.clientHeight,scale:slot.s,opacity:slot.o,rotation:hero?0:(d<0?-.55:.55),filter:`brightness(${hero?1.06:.76+slot.o*.22}) blur(${slot.b}px)`,zIndex:100-Math.round(Math.abs(d)*10)});
    });
  }

  function rebuild(){
    const stage=ensureStage(),items=baseDishes();stage.innerHTML='';
    items.forEach((base,i)=>{
      const img=$('img',base);if(!img)return;
      const btn=document.createElement('button');btn.type='button';btn.className='editorial-flow-plate';btn.dataset.id=base.dataset.id||'';btn.dataset.index=String(i);btn.tabIndex=-1;
      const clone=img.cloneNode(true);clone.removeAttribute('style');btn.appendChild(clone);
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();if(pointer?.moved)return;
        const target=Number(btn.dataset.index),n=count();let d=target-activeIndex;while(d>n/2)d-=n;while(d<-n/2)d+=n;
        if(d===0)passBaseClick(base);else step(Math.sign(d));markInteraction();
      });
      stage.appendChild(btn);
    });
    activeIndex=counterIndex();logicalPosition=activeIndex;renderAt(logicalPosition);
  }

  function setHeadline(meta,animate=true){
    ensureHeadline();if(!dynamicTitle)return;
    const apply=()=>{dynamicTitle.textContent=meta.headline;dynamicTitle.style.color=meta.color;root.style.setProperty('--editorial-flow-accent',meta.color)};
    gsap.killTweensOf(dynamicTitle);
    if(!animate||reduced.matches){apply();gsap.set(dynamicTitle,{opacity:1,y:0});return}
    apply();gsap.fromTo(dynamicTitle,{opacity:0,y:18},{opacity:1,y:0,duration:.40,ease:'power3.out',overwrite:true});
  }
  function exitHeadline(){if(!dynamicTitle||reduced.matches)return;gsap.killTweensOf(dynamicTitle);gsap.to(dynamicTitle,{opacity:0,y:-15,duration:.24,ease:'power2.in',overwrite:true})}

  function commitCue(index){
    if(pendingIndex===null)return;
    activeIndex=normalize(index);setHeadline(metadataForIndex(activeIndex),true);pendingIndex=null;clearTimeout(commitFallback);commitFallback=null;
    root.dataset.editorialFlowCue='committed';
  }

  function passBaseClick(button){internalPass=true;try{button?.click()}finally{queueMicrotask(()=>{internalPass=false})}}
  function passBaseStep(direction){passBaseClick(direction>0?$('#next-dish'):$('#prev-dish'))}

  function step(direction=1,source='manual'){
    if(!isFlow()||detailOpen()||transitioning||!count())return;
    transitioning=true;stopAuto();master?.kill?.();clearTimeout(commitFallback);
    const n=count(),start=logicalPosition,target=start+direction,targetIndex=normalize(Math.round(target),n),state={p:start};
    pendingIndex=targetIndex;root.dataset.editorialFlowCue='waiting';exitHeadline();

    master=gsap.timeline({onComplete(){logicalPosition=target;activeIndex=targetIndex;renderAt(logicalPosition);if(pendingIndex!==null)commitCue(targetIndex);transitioning=false;root.dataset.orbitalChoreography='editorial-flow-v2';if(source==='auto')scheduleAuto(1650);else markInteraction()}});
    master.to(state,{p:target,duration:reduced.matches?.01:.90,ease:reduced.matches?'none':'power2.inOut',onUpdate(){renderAt(state.p)}},0);
    master.call(()=>passBaseStep(direction),null,reduced.matches?0:.02);
    commitFallback=setTimeout(()=>{if(pendingIndex!==null)commitCue(targetIndex)},reduced.matches?20:520);
  }

  function stopAuto(){clearTimeout(autoTimer);clearTimeout(resumeTimer);autoTimer=null;resumeTimer=null}
  function scheduleAuto(delay=2200){clearTimeout(autoTimer);if(!isFlow()||reduced.matches||detailOpen()||!inView||transitioning)return;autoTimer=setTimeout(()=>step(1,'auto'),delay)}
  function markInteraction(){clearTimeout(autoTimer);clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>scheduleAuto(300),3600)}

  function activate(){
    injectStudioOption();injectStyles();ensureStage();ensureHeadline();ensureDishStudioFields();
    if(isFlow()){
      if(flowStage.children.length!==baseDishes().length)rebuild();
      flowStage.hidden=false;activeIndex=counterIndex();logicalPosition=activeIndex;renderAt(logicalPosition);setHeadline(metadataForIndex(activeIndex),false);scheduleAuto(900);
    }else{if(flowStage)flowStage.hidden=true;stopAuto();master?.kill?.();transitioning=false;pendingIndex=null}
  }

  const counter=$('#dish-counter');
  new MutationObserver(()=>{
    if(!isFlow())return;const idx=counterIndex();
    if(transitioning&&pendingIndex!==null&&idx===pendingIndex){commitCue(idx);return}
    if(!transitioning&&idx!==activeIndex){
      const n=count();let d=idx-activeIndex;while(d>n/2)d-=n;while(d<-n/2)d+=n;activeIndex=idx;logicalPosition+=d;
      const s={p:logicalPosition-d};exitHeadline();gsap.to(s,{p:logicalPosition,duration:.72,ease:'power2.inOut',onUpdate(){renderAt(s.p)},onComplete(){setHeadline(metadataForIndex(activeIndex),true)}});
    }
  }).observe(counter||copy,{subtree:true,childList:true,characterData:true});
  new MutationObserver(()=>{if(isFlow())setTimeout(rebuild,30)}).observe(baseStage,{childList:true});

  const io=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting&&e.intersectionRatio>.32);if(inView)scheduleAuto(900);else stopAuto()},{threshold:[0,.32,.6]});io.observe(shell);

  document.addEventListener('click',e=>{
    if(!isFlow()||internalPass)return;const next=e.target.closest('#next-dish'),prev=e.target.closest('#prev-dish');if(!next&&!prev)return;
    e.preventDefault();e.stopImmediatePropagation();step(next?1:-1,'button');
  },true);
  document.addEventListener('wheel',e=>{
    if(!isFlow()||!shell.contains(e.target)||Math.abs(e.deltaY)<4)return;
    e.preventDefault();e.stopImmediatePropagation();const now=performance.now();if(now-lastWheel<520)return;lastWheel=now;step(e.deltaY>=0?1:-1,'wheel');
  },{capture:true,passive:false});
  document.addEventListener('keydown',e=>{
    if(!isFlow()||!shell.contains(document.activeElement)||(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'))return;
    e.preventDefault();e.stopImmediatePropagation();step(e.key==='ArrowRight'?1:-1,'keyboard');
  },true);
  document.addEventListener('pointerdown',e=>{
    if(!isFlow()||!shell.contains(e.target))return;pointer={x:e.clientX,y:e.clientY,moved:false};e.stopImmediatePropagation();markInteraction();
  },true);
  document.addEventListener('pointermove',e=>{
    if(!pointer||!isFlow())return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>8)pointer.moved=true;e.stopImmediatePropagation();
  },true);
  document.addEventListener('pointerup',e=>{
    if(!pointer||!isFlow())return;const dx=e.clientX-pointer.x,moved=pointer.moved;pointer=null;e.stopImmediatePropagation();if(moved&&Math.abs(dx)>22)step(dx<0?1:-1,'drag');
  },true);

  window.addEventListener('restaurant:motion-change',()=>setTimeout(activate,0));
  window.addEventListener('restaurant:dish-detail-open',stopAuto);
  window.addEventListener('restaurant:dish-detail-close',()=>scheduleAuto(700));
  reduced.addEventListener?.('change',activate);
  addEventListener('resize',()=>{if(isFlow())renderAt(logicalPosition)});

  async function restoreStudioMode(){
    if(!injectStudioOption())return;
    try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config?.motion?.orbitalStyle===MODE){const select=$('#motion-orbital-style');select.value=MODE;window.RestaurantMotionStudio?.publish?.()}}catch{}
  }

  async function boot(){
    injectStudioOption();injectStyles();ensureDefaultMetadata();wrapPersistence();await loadOverrides();rebuild();ensureHeadline();ensureDishStudioFields();await restoreStudioMode();setTimeout(activate,40);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,240));else setTimeout(boot,240);

  window.RestaurantEditorialFlow={activate,rebuild,step,renderAt,metadataForIndex};
})();
