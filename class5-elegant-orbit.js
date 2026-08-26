/* CLASS 05 — ELEGANT ORBIT · approved choreography, selectable per project. */
(() => {
  'use strict';
  if(!window.gsap||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const shell=document.querySelector('.orbit-shell'),stage=document.querySelector('#orbit-stage');
  if(!shell||!stage)return;
  const isElegant=()=>document.documentElement.dataset.orbitalMotion==='elegant';
  const detailIsOpen=()=>document.documentElement.dataset.dishDetail==='open';
  let lastDance=0,dragStartX=null,breathTween=null,breathTimer=null;
  const dishes=()=>[...stage.querySelectorAll('.orbit-dish')];
  const shellCenter=()=>{const r=shell.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
  const dishInfo=()=>{const c=shellCenter();return dishes().map((el,index)=>{const r=el.getBoundingClientRect();return{el,index,x:r.left+r.width/2,y:r.top+r.height/2,dx:r.left+r.width/2-c.x,dy:r.top+r.height/2-c.y}})};
  const centreInfo=()=>dishInfo().sort((a,b)=>Math.abs(a.dx)+Math.abs(a.dy)*.22-(Math.abs(b.dx)+Math.abs(b.dy)*.22))[0];
  function stopBreathing(){clearTimeout(breathTimer);breathTween?.kill?.();breathTween=null;dishes().forEach(el=>{const img=el.querySelector('img');if(img)gsap.set(img,{scale:1,y:0,rotation:0,scaleX:1,scaleY:1,opacity:1,filter:'brightness(1) blur(0px)'})})}
  function startBreathing(){if(!isElegant()||detailIsOpen())return;clearTimeout(breathTimer);breathTimer=setTimeout(()=>{if(!isElegant()||detailIsOpen())return;const img=centreInfo()?.el.querySelector('img');if(img)breathTween=gsap.to(img,{scale:1.012,y:-2,duration:1.75,ease:'sine.inOut',yoyo:true,repeat:-1})},1050)}
  function dance(direction=1,source='step'){if(!isElegant()||detailIsOpen())return;document.documentElement.dataset.orbitalChoreography='elegant-orbit-v1';const now=performance.now();if(source==='wheel'&&now-lastDance<260)return;lastDance=now;stopBreathing();const info=dishInfo();if(info.length<2)return;const centre=centreInfo(),candidates=info.filter(x=>direction>0?x.dx>8:x.dx<-8).sort((a,b)=>Math.abs(a.dx)-Math.abs(b.dx)),incoming=candidates[0]||info.filter(x=>x!==centre).sort((a,b)=>Math.abs(a.dx)-Math.abs(b.dx))[0];info.forEach(item=>{const img=item.el.querySelector('img');if(!img)return;gsap.killTweensOf(img);const side=Math.sign(item.dx)||direction,distanceRank=Math.min(3,Math.round(Math.abs(item.dx)/(Math.max(1,shell.clientWidth)*.16)));if(item===incoming){gsap.timeline({delay:.025}).to(img,{y:-17,rotation:direction*7.2,scaleX:.965,scaleY:1.025,scale:.985,duration:.22,ease:'power2.out'}).to(img,{y:-7,rotation:direction*-2.2,scaleX:1.015,scaleY:.99,scale:1.045,duration:.28,ease:'power3.inOut'}).to(img,{y:2,rotation:direction*.65,scaleX:1.004,scaleY:.997,scale:1.018,duration:.18,ease:'power2.out'}).to(img,{y:0,rotation:0,scaleX:1,scaleY:1,scale:1,duration:.20,ease:'sine.out'})}else if(item===centre){gsap.timeline().to(img,{y:7,rotation:direction*-3.8,scale:.982,scaleX:.99,scaleY:1.01,duration:.20,ease:'power2.in'}).to(img,{y:-4,rotation:direction*-5.2,scale:.97,duration:.25,ease:'power2.inOut'}).to(img,{y:0,rotation:0,scale:1,scaleX:1,scaleY:1,duration:.28,ease:'power3.out'})}else{const delay=.035+distanceRank*.018,lift=4+Math.max(0,2-distanceRank)*2,twist=side*(2.1+distanceRank*.55);gsap.timeline({delay}).to(img,{y:-lift,rotation:twist,scaleX:.99,scaleY:1.008,duration:.22,ease:'sine.out'}).to(img,{y:1,rotation:-twist*.28,duration:.24,ease:'sine.inOut'}).to(img,{y:0,rotation:0,scaleX:1,scaleY:1,duration:.24,ease:'sine.out'})}});const copy=document.querySelector('.dish-copy');if(copy)gsap.fromTo(copy,{x:direction*8,opacity:.82},{x:0,opacity:1,duration:.52,delay:.22,ease:'power3.out',overwrite:true});startBreathing()}
  function bind(){const next=document.querySelector('#next-dish'),prev=document.querySelector('#prev-dish');next?.addEventListener('click',()=>{if(isElegant())dance(1,'button')},true);prev?.addEventListener('click',()=>{if(isElegant())dance(-1,'button')},true);shell.addEventListener('wheel',e=>{if(isElegant())dance(e.deltaY>=0?1:-1,'wheel')},{passive:true,capture:true});shell.addEventListener('keydown',e=>{if(!isElegant()||detailIsOpen())return;if(e.key==='ArrowRight')dance(1,'keyboard');if(e.key==='ArrowLeft')dance(-1,'keyboard')},true);shell.addEventListener('pointerdown',e=>{if(!isElegant()||detailIsOpen())return;dragStartX=e.clientX;stopBreathing()},{passive:true,capture:true});shell.addEventListener('pointerup',e=>{if(!isElegant()||detailIsOpen()||dragStartX===null)return;const dx=e.clientX-dragStartX;dragStartX=null;if(Math.abs(dx)>16)dance(dx<0?1:-1,'drag');else startBreathing()},{passive:true,capture:true});stage.addEventListener('click',e=>{if(!isElegant()||detailIsOpen())return;const dish=e.target.closest('.orbit-dish');if(!dish)return;const c=shellCenter(),r=dish.getBoundingClientRect(),dx=r.left+r.width/2-c.x;if(Math.abs(dx)>20)dance(dx>0?1:-1,'dish')},true)}
  function activate(){if(isElegant()&&!detailIsOpen()){document.documentElement.dataset.orbitalChoreography='elegant-orbit-v1';startBreathing()}else stopBreathing()}
  window.addEventListener('restaurant:motion-change',activate);
  window.addEventListener('restaurant:dish-detail-open',()=>{dragStartX=null;stopBreathing()});
  window.addEventListener('restaurant:dish-detail-close',()=>{if(isElegant())setTimeout(startBreathing,120)});
  const wait=()=>{if(dishes().length){bind();activate();return}const o=new MutationObserver(()=>{if(dishes().length){o.disconnect();bind();activate()}});o.observe(stage,{childList:true});setTimeout(()=>o.disconnect(),5000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,240));else setTimeout(wait,240);
})();

/* Load the third choreography as an additive capability without changing the proven entrypoint. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-editorial-flow-runtime]'))return;
    const s=document.createElement('script');s.src='class7-editorial-flow.js';s.dataset.editorialFlowRuntime='1';document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,40));else setTimeout(load,40);
})();