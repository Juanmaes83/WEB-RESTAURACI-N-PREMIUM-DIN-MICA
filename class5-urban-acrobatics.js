/* CLASS 05 — URBAN ACROBATICS · THE ORBITAL MENU ONLY
   Four roles per transition: SOLOIST, OUTGOING LEAD, FEATURE DANCER, ENSEMBLE.
   This layer never owns Studio, persistence, content or non-orbital sections. */
(() => {
  'use strict';
  if (!window.gsap) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const shell = $('.orbit-shell');
  const stage = $('#orbit-stage');
  if (!shell || !stage) return;

  document.documentElement.dataset.orbitalChoreography = 'urban-acrobatics-v2';

  let step = 0;
  let lastInputAt = 0;
  let dragStartX = null;
  let dragging = false;
  let settleTimer = null;
  let breatheTween = null;
  let lockedUntil = 0;

  const trickSequence = ['tripleSpin','reverseSweep','airTurn','tripleSpin','reverseSweep'];
  const dishes = () => $$('.orbit-dish', stage);
  const shellCenter = () => {
    const r = shell.getBoundingClientRect();
    return { x:r.left+r.width/2, y:r.top+r.height/2 };
  };
  const info = () => {
    const c = shellCenter();
    return dishes().map((el,index) => {
      const r = el.getBoundingClientRect();
      return {
        el,index,
        img:$('img',el),
        x:r.left+r.width/2,
        y:r.top+r.height/2,
        dx:r.left+r.width/2-c.x,
        dy:r.top+r.height/2-c.y
      };
    });
  };
  const centre = list => [...list].sort((a,b)=>(Math.abs(a.dx)+Math.abs(a.dy)*.18)-(Math.abs(b.dx)+Math.abs(b.dy)*.18))[0];
  const incomingFor = (list,current,direction) => {
    const side = list.filter(x => x !== current && (direction > 0 ? x.dx > 10 : x.dx < -10))
      .sort((a,b)=>Math.abs(a.dx)-Math.abs(b.dx));
    return side[0] || list.filter(x=>x!==current).sort((a,b)=>Math.abs(a.dx)-Math.abs(b.dx))[0];
  };
  const featureFor = (list,current,incoming,direction) => {
    const candidates = list.filter(x=>x!==current && x!==incoming);
    const preferred = candidates.filter(x => direction > 0 ? x.dx > 0 : x.dx < 0)
      .sort((a,b)=>Math.abs(b.dy)-Math.abs(a.dy));
    return preferred[0] || candidates.sort((a,b)=>Math.abs(b.dy)-Math.abs(a.dy))[0];
  };

  function killAll(){
    clearTimeout(settleTimer);
    breatheTween?.kill?.();
    breatheTween = null;
    dishes().forEach(el => {
      const img = $('img',el);
      if (img) gsap.killTweensOf(img);
    });
    const copy = $('.dish-copy');
    if (copy) gsap.killTweensOf(copy.children);
  }

  function settleAll(){
    dishes().forEach(el => {
      const img = $('img',el);
      if (!img) return;
      gsap.to(img,{x:0,y:0,rotation:0,scale:1,scaleX:1,scaleY:1,filter:'brightness(1)',duration:.22,ease:'power2.out',overwrite:true});
    });
    $$('.orbit-dish',stage).forEach(el=>gsap.to(el,{opacity:1,duration:.22,overwrite:'auto'}));
  }

  function startHeroBreath(){
    clearTimeout(settleTimer);
    settleTimer = setTimeout(()=>{
      const list = info();
      const hero = centre(list);
      if (!hero?.img) return;
      breatheTween = gsap.to(hero.img,{scale:1.018,y:-2,duration:1.55,ease:'sine.inOut',yoyo:true,repeat:-1});
    },1250);
  }

  function dimEnsemble(list,solo,outgoing,feature){
    list.forEach(item=>{
      let opacity=.64;
      if(item===solo) opacity=1;
      else if(item===feature) opacity=.90;
      else if(item===outgoing) opacity=.82;
      gsap.to(item.el,{opacity,duration:.16,ease:'power2.out',overwrite:'auto'});
    });
  }

  function trickTripleSpin(item,direction,quick){
    if(!item?.img) return;
    const t = quick ? .52 : .91;
    gsap.timeline({defaults:{overwrite:true}})
      .to(item.img,{y:-10,scale:.94,rotation:direction*120,scaleX:.95,scaleY:1.03,duration:t*.18,ease:'power2.in'})
      .to(item.img,{y:-22,scale:1.04,rotation:direction*720,scaleX:1.02,scaleY:.98,duration:t*.38,ease:'power4.inOut'})
      .to(item.img,{y:-8,scale:1.02,rotation:direction*1080,scaleX:.98,scaleY:1.02,duration:t*.28,ease:'power3.out'})
      .to(item.img,{y:0,scale:1,rotation:direction*1080,scaleX:1,scaleY:1,duration:t*.16,ease:'expo.out'});
  }

  function trickReverseSweep(item,direction,quick){
    if(!item?.img) return;
    const t = quick ? .50 : .88;
    gsap.timeline({defaults:{overwrite:true}})
      .to(item.img,{x:-direction*18,y:12,scale:.91,rotation:-direction*38,filter:'brightness(.72)',duration:t*.24,ease:'power3.in'})
      .to(item.img,{x:-direction*38,y:20,scale:.82,rotation:-direction*150,filter:'brightness(.58)',duration:t*.26,ease:'power3.inOut'})
      .to(item.img,{x:direction*14,y:-10,scale:1.05,rotation:-direction*220,filter:'brightness(1.08)',duration:t*.30,ease:'power4.out'})
      .to(item.img,{x:0,y:0,scale:1,rotation:0,filter:'brightness(1)',duration:t*.20,ease:'expo.out'});
  }

  function trickAirTurn(item,direction,quick){
    if(!item?.img) return;
    const t = quick ? .50 : .90;
    gsap.timeline({defaults:{overwrite:true}})
      .to(item.img,{y:-18,scale:.88,rotation:direction*70,scaleX:.94,scaleY:1.04,duration:t*.24,ease:'power3.in'})
      .to(item.img,{y:-36,scale:.80,rotation:direction*220,filter:'brightness(1.10)',duration:t*.28,ease:'power2.out'})
      .to(item.img,{y:-10,scale:1.08,rotation:direction*360,scaleX:1.025,scaleY:.98,duration:t*.28,ease:'power4.inOut'})
      .to(item.img,{y:0,scale:1,rotation:direction*360,scaleX:1,scaleY:1,filter:'brightness(1)',duration:t*.20,ease:'expo.out'});
  }

  function runFeatureTrick(item,trick,direction,quick){
    if(trick==='reverseSweep') return trickReverseSweep(item,direction,quick);
    if(trick==='airTurn') return trickAirTurn(item,direction,quick);
    return trickTripleSpin(item,direction,quick);
  }

  function outgoingLead(item,direction,quick){
    if(!item?.img) return;
    const t = quick ? .48 : .82;
    gsap.timeline({defaults:{overwrite:true}})
      .to(item.img,{y:8,x:-direction*6,rotation:-direction*4.5,scale:.975,duration:t*.23,ease:'power2.in'})
      .to(item.img,{y:-7,x:-direction*12,rotation:-direction*7,scale:.945,filter:'brightness(.86)',duration:t*.31,ease:'power3.inOut'})
      .to(item.img,{y:0,x:0,rotation:0,scale:1,filter:'brightness(1)',duration:t*.46,ease:'power4.out'});
  }

  function soloist(item,direction,quick){
    if(!item?.img) return;
    const t = quick ? .56 : .94;
    gsap.timeline({delay:quick?.05:.14,defaults:{overwrite:true}})
      .to(item.img,{x:-direction*8,y:4,rotation:direction*3.5,scale:.94,scaleX:.98,scaleY:1.01,duration:t*.13,ease:'power2.in'})
      .to(item.img,{x:direction*3,y:-16,rotation:direction*8,scale:1.02,scaleX:.95,scaleY:1.035,duration:t*.22,ease:'power4.inOut'})
      .to(item.img,{x:0,y:-14,rotation:-direction*3,scale:1.24,scaleX:1.018,scaleY:.987,filter:'brightness(1.14) drop-shadow(0 18px 22px rgba(0,0,0,.45))',duration:t*.34,ease:'power4.inOut'})
      .to(item.img,{y:4,rotation:direction*.8,scale:1.16,scaleX:1.005,scaleY:.996,filter:'brightness(1.08) drop-shadow(0 13px 18px rgba(0,0,0,.40))',duration:t*.16,ease:'expo.out'})
      .to(item.img,{y:0,rotation:0,scale:1,scaleX:1,scaleY:1,filter:'brightness(1)',duration:t*.15,ease:'expo.out'});
  }

  function ensembleBeat(list,solo,outgoing,feature,direction,quick){
    const rest = list.filter(x=>x!==solo && x!==outgoing && x!==feature);
    rest.forEach((item,i)=>{
      if(!item.img) return;
      const side = Math.sign(item.dx)||direction;
      const amp = Math.abs(item.dy)>70 ? 5 : 8;
      const delay = (quick?.035:.06) + i*(quick?.018:.035);
      gsap.timeline({delay,defaults:{overwrite:true}})
        .to(item.img,{y:-amp,rotation:side*1.8,scale:.985,filter:'brightness(.68)',duration:quick?.10:.15,ease:'power2.out'})
        .to(item.img,{y:2,rotation:-side*.55,scale:1.012,filter:'brightness(.76)',duration:quick?.12:.17,ease:'power2.inOut'})
        .to(item.img,{y:0,rotation:0,scale:1,filter:'brightness(1)',duration:quick?.14:.20,ease:'power3.out'});
    });
  }

  function copyHit(quick){
    const nodes = [$('#dish-title'),$('#dish-meta'),$('#dish-short')].filter(Boolean);
    if(!nodes.length) return;
    gsap.set(nodes,{opacity:0,y:quick?8:12});
    gsap.to(nodes,{opacity:1,y:0,duration:quick?.22:.34,stagger:quick?.025:.05,delay:quick?.42:.80,ease:'power3.out',overwrite:true});
  }

  function choreograph(direction=1,source='button'){
    const now = performance.now();
    const rapid = now-lastInputAt < 520;
    lastInputAt = now;
    if(now < lockedUntil && source!=='wheel') return;
    const quick = source==='wheel' && rapid;
    lockedUntil = now + (quick ? 430 : 760);

    killAll();
    const list = info();
    if(list.length<3) return;
    const outgoing = centre(list);
    const solo = incomingFor(list,outgoing,direction);
    const feature = featureFor(list,outgoing,solo,direction);
    const trick = trickSequence[step % trickSequence.length];
    step++;

    dimEnsemble(list,solo,outgoing,feature);
    outgoingLead(outgoing,direction,quick);
    setTimeout(()=>runFeatureTrick(feature,trick,direction,quick),quick?35:80);
    soloist(solo,direction,quick);
    ensembleBeat(list,solo,outgoing,feature,direction,quick);
    copyHit(quick);

    setTimeout(()=>{
      settleAll();
      startHeroBreath();
    }, quick ? 560 : 1030);
  }

  function bind(){
    const next = $('#next-dish');
    const prev = $('#prev-dish');

    next?.addEventListener('click',()=>choreograph(1,'button'),true);
    prev?.addEventListener('click',()=>choreograph(-1,'button'),true);

    shell.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight') choreograph(1,'keyboard');
      if(e.key==='ArrowLeft') choreograph(-1,'keyboard');
    },true);

    shell.addEventListener('wheel',e=>{
      if(Math.abs(e.deltaY)<3) return;
      choreograph(e.deltaY>=0?1:-1,'wheel');
    },{passive:true,capture:true});

    shell.addEventListener('pointerdown',e=>{
      dragStartX=e.clientX;
      dragging=true;
      killAll();
    },{passive:true,capture:true});

    shell.addEventListener('pointerup',e=>{
      if(!dragging || dragStartX===null) return;
      const dx=e.clientX-dragStartX;
      dragging=false;
      dragStartX=null;
      if(Math.abs(dx)>18){
        /* Drag stays physical. Only the landing phrase is choreographed after release. */
        choreograph(dx<0?1:-1,'drag-release');
      }else{
        settleAll();
        startHeroBreath();
      }
    },{passive:true,capture:true});

    stage.addEventListener('click',e=>{
      const dish=e.target.closest('.orbit-dish');
      if(!dish) return;
      const c=shellCenter();
      const r=dish.getBoundingClientRect();
      const dx=r.left+r.width/2-c.x;
      if(Math.abs(dx)>22) choreograph(dx>0?1:-1,'dish');
    },true);
  }

  function waitForOrbit(){
    if(dishes().length){
      bind();
      settleAll();
      startHeroBreath();
      return;
    }
    const observer=new MutationObserver(()=>{
      if(!dishes().length) return;
      observer.disconnect();
      bind();
      settleAll();
      startHeroBreath();
    });
    observer.observe(stage,{childList:true});
    setTimeout(()=>observer.disconnect(),5000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(waitForOrbit,220));
  else setTimeout(waitForOrbit,220);
})();