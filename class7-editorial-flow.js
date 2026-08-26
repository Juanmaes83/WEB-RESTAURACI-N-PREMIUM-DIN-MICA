/* CLASS 07 — EDITORIAL FLOW · reconstructed from video reference.
   Third selectable choreography. Keeps the proven Orbital Engine as state source,
   but renders an independent vertical-diagonal visual track synchronized with dish copy. */
(() => {
  'use strict';
  if(!window.gsap)return;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const shell=$('.orbit-shell'),baseStage=$('#orbit-stage'),copy=$('.dish-copy');
  if(!shell||!baseStage||!copy)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const MODE='editorial-flow';
  let flowStage=null, active=-1, rebuildTimer=null, autoTimer=null, resumeTimer=null;
  let inView=false, pointerStart=null;

  const isFlow=()=>root.dataset.orbitalMotion===MODE;
  const detailOpen=()=>root.dataset.dishDetail==='open'||document.body.classList.contains('detail-open');
  const baseDishes=()=>$$('.orbit-dish',baseStage);

  function injectStudioOption(){
    const select=$('#motion-orbital-style');
    if(!select)return false;
    if(!select.querySelector(`option[value="${MODE}"]`)){
      const option=document.createElement('option');
      option.value=MODE;option.textContent='Editorial Flow';select.appendChild(option);
    }
    return true;
  }

  async function restoreStudioMode(){
    if(!injectStudioOption())return;
    try{
      const saved=await window.RestaurantStore?.loadProject?.();
      const mode=saved?.config?.motion?.orbitalStyle;
      if(mode===MODE){
        const select=$('#motion-orbital-style');
        select.value=MODE;
        window.RestaurantMotionStudio?.publish?.();
      }
    }catch(err){console.warn('Editorial Flow restore skipped',err)}
  }

  function injectStyles(){
    if($('#editorial-flow-styles'))return;
    const style=document.createElement('style');style.id='editorial-flow-styles';
    style.textContent=`
      html[data-orbital-motion="${MODE}"] .orbit-ring,
      html[data-orbital-motion="${MODE}"] .orbit-center-mark,
      html[data-orbital-motion="${MODE}"] .orbit-glow{opacity:.14}
      html[data-orbital-motion="${MODE}"] #orbit-stage{visibility:hidden;pointer-events:none}
      .editorial-flow-stage{position:absolute;inset:0;overflow:hidden;z-index:8;pointer-events:none}
      .editorial-flow-plate{position:absolute;left:0;top:0;width:clamp(116px,16vw,230px);aspect-ratio:1;border:0;background:transparent;padding:0;border-radius:50%;pointer-events:auto;cursor:pointer;will-change:transform,opacity,filter;transform-origin:50% 50%}
      .editorial-flow-plate img{width:100%;height:100%;display:block;object-fit:contain;border-radius:50%;filter:drop-shadow(0 20px 26px rgba(0,0,0,.34))}
      html[data-orbital-motion="${MODE}"] .dish-copy{position:relative}
      html[data-orbital-motion="${MODE}"] #dish-title{color:var(--accent)}
      .editorial-flow-title-ghost{position:fixed;z-index:9998;pointer-events:none;margin:0;color:var(--paper);font:inherit;line-height:inherit;letter-spacing:inherit;white-space:normal;will-change:transform,opacity}
      @media(max-width:700px){.editorial-flow-plate{width:clamp(92px,27vw,154px)}}
    `;
    document.head.appendChild(style);
  }

  function ensureStage(){
    if(flowStage?.isConnected)return flowStage;
    flowStage=document.createElement('div');flowStage.className='editorial-flow-stage';flowStage.setAttribute('aria-hidden','true');
    shell.appendChild(flowStage);return flowStage;
  }

  function counterIndex(){
    const txt=$('#dish-counter')?.textContent||'';
    const n=parseInt(txt,10);return Number.isFinite(n)?Math.max(0,n-1):0;
  }

  function circularDistance(i,a,n){
    let d=i-a;while(d>n/2)d-=n;while(d<-n/2)d+=n;return d;
  }

  function slotFor(d){
    const mobile=innerWidth<700;
    const slots=mobile?{
      '-3':{x:77,y:-18,s:.48,o:.10,b:2.8},'-2':{x:72,y:3,s:.58,o:.30,b:2.0},'-1':{x:67,y:25,s:.76,o:.68,b:.8},
      '0':{x:61,y:51,s:1.08,o:1,b:0},'1':{x:68,y:78,s:.77,o:.72,b:.7},'2':{x:73,y:101,s:.59,o:.34,b:1.8},'3':{x:77,y:121,s:.46,o:.10,b:2.8}
    }:{
      '-3':{x:79,y:-22,s:.44,o:.08,b:3.2},'-2':{x:75,y:0,s:.56,o:.26,b:2.2},'-1':{x:70,y:24,s:.75,o:.66,b:.9},
      '0':{x:64,y:50,s:1.10,o:1,b:0},'1':{x:70,y:77,s:.76,o:.70,b:.8},'2':{x:75,y:101,s:.56,o:.30,b:2.0},'3':{x:79,y:123,s:.44,o:.08,b:3.2}
    };
    const k=String(Math.max(-3,Math.min(3,Math.round(d))));return slots[k];
  }

  function rebuild(){
    clearTimeout(rebuildTimer);const stage=ensureStage(),items=baseDishes();
    stage.innerHTML='';
    items.forEach((base,i)=>{
      const img=$('img',base);if(!img)return;
      const btn=document.createElement('button');btn.type='button';btn.className='editorial-flow-plate';btn.dataset.id=base.dataset.id||'';btn.dataset.index=String(i);btn.tabIndex=-1;
      const clone=img.cloneNode(true);clone.removeAttribute('style');btn.appendChild(clone);
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(pointerStart&&pointerStart.moved)return;base.click();markInteraction()});
      stage.appendChild(btn);
    });
    active=counterIndex();layout(false);
  }

  function layout(animate=true,direction=1){
    if(!flowStage)return;const plates=$$('.editorial-flow-plate',flowStage),n=plates.length;if(!n)return;
    plates.forEach((plate,i)=>{
      const d=circularDistance(i,active,n),slot=slotFor(d),isHero=Math.abs(d)<.5;
      const vars={xPercent:-50,yPercent:-50,x:`${slot.x/100*shell.clientWidth}px`,y:`${slot.y/100*shell.clientHeight}px`,scale:slot.s,opacity:slot.o,filter:`brightness(${isHero?1.06:.76+slot.o*.22}) blur(${slot.b}px)`,rotation:isHero?0:(d<0?-2.2:2.2),zIndex:100-Math.abs(Math.round(d))*10,overwrite:true};
      gsap.killTweensOf(plate);
      if(reduced.matches||!animate)gsap.set(plate,vars);
      else gsap.to(plate,{...vars,duration:.86,ease:'power3.inOut'});
    });
    root.dataset.orbitalChoreography='editorial-flow-v1';
  }

  function animateCopy(oldTitle){
    if(reduced.matches)return;
    const title=$('#dish-title');if(!title)return;
    if(oldTitle){
      const r=title.getBoundingClientRect(),cs=getComputedStyle(title),ghost=document.createElement('div');
      ghost.className='editorial-flow-title-ghost';ghost.textContent=oldTitle;
      Object.assign(ghost.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,fontFamily:cs.fontFamily,fontSize:cs.fontSize,fontWeight:cs.fontWeight,lineHeight:cs.lineHeight,letterSpacing:cs.letterSpacing});
      document.body.appendChild(ghost);
      gsap.fromTo(ghost,{opacity:.92,y:0},{opacity:0,y:-18,duration:.34,ease:'power2.in',onComplete:()=>ghost.remove()});
    }
    const nodes=[$('#dish-title'),$('#dish-meta'),$('#dish-short')].filter(Boolean);
    gsap.killTweensOf(nodes);
    gsap.fromTo(nodes,{opacity:0,y:14},{opacity:1,y:0,duration:.46,stagger:.045,ease:'power3.out',overwrite:true});
  }

  function syncFromBase(){
    const next=counterIndex();if(next===active)return;
    const oldTitle=$('#dish-title')?.dataset.flowPrevious||'';
    const currentTitle=$('#dish-title')?.textContent||'';
    const n=flowStage?$$('.editorial-flow-plate',flowStage).length:0;
    let delta=n?circularDistance(next,active,n):1;
    active=next;layout(true,Math.sign(delta)||1);animateCopy(oldTitle);
    if($('#dish-title'))$('#dish-title').dataset.flowPrevious=currentTitle;
  }

  function activate(){
    injectStudioOption();injectStyles();ensureStage();
    if(isFlow()){
      if(flowStage.children.length!==baseDishes().length)rebuild();
      flowStage.hidden=false;active=counterIndex();layout(false);
      const t=$('#dish-title');if(t)t.dataset.flowPrevious=t.textContent||'';
      scheduleAuto(900);
    }else{
      if(flowStage)flowStage.hidden=true;stopAuto();
    }
  }

  function stopAuto(){clearTimeout(autoTimer);clearTimeout(resumeTimer);autoTimer=null;resumeTimer=null}
  function scheduleAuto(delay=2300){
    clearTimeout(autoTimer);if(!isFlow()||reduced.matches||detailOpen()||!inView)return;
    autoTimer=setTimeout(()=>{
      if(!isFlow()||detailOpen()||!inView)return;
      $('#next-dish')?.click();scheduleAuto(2300);
    },delay);
  }
  function markInteraction(){clearTimeout(autoTimer);clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>scheduleAuto(300),3800)}

  const counter=$('#dish-counter');
  new MutationObserver(()=>{if(isFlow())requestAnimationFrame(syncFromBase)}).observe(counter||copy,{subtree:true,childList:true,characterData:true});
  new MutationObserver(()=>{clearTimeout(rebuildTimer);rebuildTimer=setTimeout(()=>{if(isFlow())rebuild()},40)}).observe(baseStage,{childList:true});

  const io=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting&&e.intersectionRatio>.32);if(inView)scheduleAuto(900);else stopAuto()},{threshold:[0,.32,.6]});io.observe(shell);

  shell.addEventListener('wheel',()=>{if(isFlow())markInteraction()},{passive:true,capture:true});
  shell.addEventListener('keydown',()=>{if(isFlow())markInteraction()},true);
  shell.addEventListener('pointerdown',e=>{if(!isFlow())return;pointerStart={x:e.clientX,y:e.clientY,moved:false};markInteraction()},true);
  shell.addEventListener('pointermove',e=>{if(!pointerStart)return;if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>8)pointerStart.moved=true},true);
  shell.addEventListener('pointerup',()=>setTimeout(()=>{pointerStart=null},0),true);

  window.addEventListener('restaurant:motion-change',()=>setTimeout(activate,0));
  window.addEventListener('restaurant:dish-detail-open',stopAuto);
  window.addEventListener('restaurant:dish-detail-close',()=>scheduleAuto(700));
  reduced.addEventListener?.('change',activate);
  addEventListener('resize',()=>{if(isFlow())layout(false)});

  const boot=()=>{
    injectStudioOption();injectStyles();rebuild();restoreStudioMode().finally(()=>setTimeout(activate,40));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,260));else setTimeout(boot,260);

  window.RestaurantEditorialFlow={activate,rebuild,layout};
})();