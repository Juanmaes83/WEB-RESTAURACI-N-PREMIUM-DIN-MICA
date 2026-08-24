/* CLASS 05 — URBAN ACROBATICS V4 · THE ORBITAL MENU ONLY
   V3 harmony preserved. V4 changes ONLY protagonist authority:
   strong pull-back -> attack -> elegant hard brake -> ensemble recoil -> identity.
   The approved Class 04 orbit keeps ownership of geometry and interaction state. */
(() => {
  'use strict';
  if (!window.gsap) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const shell = $('.orbit-shell');
  const stage = $('#orbit-stage');
  if (!shell || !stage) return;

  document.documentElement.dataset.orbitalChoreography = 'urban-acrobatics-v4-hero-brake';

  let master = null;
  let step = 0;
  let lastWheelAt = 0;
  let dragStartX = null;
  let dragWasActive = false;
  let breath = null;
  let breathTimer = null;
  let internalStep = false;

  const TRICKS = ['tripleSpin','reverseSweep','airTurn','tripleSpin','reverseSweep'];
  const dishes = () => $$('.orbit-dish',stage);
  const imgs = () => dishes().map(el=>$('img',el)).filter(Boolean);

  function geometry(){
    const sr=shell.getBoundingClientRect();
    const cx=sr.left+sr.width/2, cy=sr.top+sr.height/2;
    return dishes().map((el,index)=>{
      const r=el.getBoundingClientRect();
      return {el,index,img:$('img',el),dx:r.left+r.width/2-cx,dy:r.top+r.height/2-cy};
    });
  }

  const score = item => Math.abs(item.dx)+Math.abs(item.dy)*.18;
  const centre = list => [...list].sort((a,b)=>score(a)-score(b))[0];

  function incomingFor(list,outgoing,direction){
    const side=list.filter(x=>x!==outgoing && (direction>0?x.dx>8:x.dx<-8)).sort((a,b)=>score(a)-score(b));
    return side[0] || list.filter(x=>x!==outgoing).sort((a,b)=>score(a)-score(b))[0];
  }

  function featureFor(list,outgoing,solo,direction){
    const rest=list.filter(x=>x!==outgoing&&x!==solo);
    const rear=rest.filter(x=>Math.abs(x.dy)>35).sort((a,b)=>Math.abs(b.dy)-Math.abs(a.dy));
    const preferred=rear.filter(x=>direction>0?x.dx>0:x.dx<0);
    return preferred[0] || rear[0] || rest.sort((a,b)=>Math.abs(b.dx)-Math.abs(a.dx))[0];
  }

  function stopBreath(){
    clearTimeout(breathTimer);
    breath?.kill?.();
    breath=null;
  }

  function resetVisuals(duration=.18){
    imgs().forEach(img=>gsap.to(img,{x:0,y:0,rotation:0,scale:1,scaleX:1,scaleY:1,opacity:1,filter:'brightness(1) drop-shadow(0 0 0 rgba(0,0,0,0))',duration,ease:'power2.out',overwrite:true}));
  }

  function beginBreath(){
    stopBreath();
    breathTimer=setTimeout(()=>{
      const hero=centre(geometry());
      if(!hero?.img)return;
      breath=gsap.to(hero.img,{scale:1.012,y:-2,duration:1.8,ease:'sine.inOut',yoyo:true,repeat:-1,overwrite:true});
    },1450);
  }

  function killMaster(){
    stopBreath();
    master?.kill?.();
    master=null;
    imgs().forEach(img=>gsap.killTweensOf(img));
    const copy=$('.dish-copy');
    if(copy)gsap.killTweensOf(copy);
  }

  function addTripleSpin(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{rotation:direction*360,y:-12,x:direction*10,scale:.96,scaleX:.95,scaleY:1.03,filter:'brightness(.88)',duration:.20,ease:'power2.in'},.14)
      .to(img,{rotation:direction*720,y:-26,x:direction*24,scale:1.04,scaleX:1.02,scaleY:.98,filter:'brightness(1.05)',duration:.25,ease:'power4.inOut'},.34)
      .to(img,{rotation:direction*1080,y:-9,x:direction*8,scale:1.01,scaleX:.985,scaleY:1.018,filter:'brightness(.94)',duration:.25,ease:'power3.out'},.59)
      .to(img,{rotation:direction*1080,y:0,x:0,scale:1,scaleX:1,scaleY:1,filter:'brightness(.90)',duration:.14,ease:'expo.out'},.84);
  }

  function addReverseSweep(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{x:-direction*16,y:10,rotation:-direction*34,scale:.93,filter:'brightness(.78)',duration:.18,ease:'power3.in'},.14)
      .to(img,{x:-direction*44,y:24,rotation:-direction*145,scale:.83,filter:'brightness(.55)',duration:.28,ease:'power3.inOut'},.32)
      .to(img,{x:direction*16,y:-12,rotation:-direction*220,scale:1.06,filter:'brightness(1.05)',duration:.29,ease:'power4.out'},.60)
      .to(img,{x:0,y:0,rotation:0,scale:1,filter:'brightness(.90)',duration:.13,ease:'expo.out'},.89);
  }

  function addAirTurn(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{y:-18,x:direction*8,rotation:direction*70,scale:.91,scaleX:.95,scaleY:1.035,filter:'brightness(.86)',duration:.18,ease:'power3.in'},.14)
      .to(img,{y:-38,x:direction*20,rotation:direction*210,scale:.82,filter:'brightness(1.08)',duration:.26,ease:'power2.out'},.32)
      .to(img,{y:-10,x:direction*6,rotation:direction*360,scale:1.07,scaleX:1.025,scaleY:.98,filter:'brightness(.98)',duration:.28,ease:'power4.inOut'},.58)
      .to(img,{y:0,x:0,rotation:direction*360,scale:1,scaleX:1,scaleY:1,filter:'brightness(.90)',duration:.15,ease:'expo.out'},.86);
  }

  function addFeature(tl,item,trick,direction){
    if(trick==='reverseSweep')addReverseSweep(tl,item,direction);
    else if(trick==='airTurn')addAirTurn(tl,item,direction);
    else addTripleSpin(tl,item,direction);
  }

  function addOutgoing(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{x:-direction*5,y:7,rotation:-direction*3.5,scale:.98,opacity:.82,filter:'brightness(.86)',duration:.16,ease:'power2.in'},0)
      .to(img,{x:-direction*14,y:-7,rotation:-direction*6.5,scale:.95,opacity:.78,filter:'brightness(.80)',duration:.30,ease:'power3.inOut'},.16)
      .to(img,{x:0,y:0,rotation:0,scale:1,opacity:.72,filter:'brightness(.74)',duration:.34,ease:'power3.out'},.46);
  }

  /* V3 ensemble beat is deliberately preserved. */
  function addEnsemble(tl,list,solo,outgoing,feature,direction){
    const ensemble=list.filter(x=>x!==solo&&x!==outgoing&&x!==feature);
    ensemble.forEach((item,i)=>{
      if(!item.img)return;
      const side=Math.sign(item.dx)||direction;
      const hitY=Math.abs(item.dy)>60?-4:-7;
      const offset=.08+i*.018;
      tl.to(item.img,{y:hitY,rotation:side*1.6,scale:.985,opacity:.62,filter:'brightness(.66)',duration:.12,ease:'power2.out'},offset)
        .to(item.img,{y:2,rotation:-side*.45,scale:1.008,opacity:.64,filter:'brightness(.69)',duration:.13,ease:'power2.inOut'},offset+.12)
        .to(item.img,{y:0,rotation:0,scale:1,opacity:.66,filter:'brightness(.68)',duration:.18,ease:'power3.out'},offset+.25);
    });
  }

  /* V4: after the protagonist brakes, the whole crew yields physical space to it. */
  function addEnsembleRecoil(tl,list,solo){
    const others=list.filter(x=>x!==solo);
    others.forEach((item,i)=>{
      if(!item.img)return;
      const side=Math.sign(item.dx)||((i%2)?1:-1);
      const rear=Math.abs(item.dy)>55;
      tl.to(item.img,{
        x:side*(rear?7:11),
        y:rear?5:8,
        scale:rear?.88:.91,
        opacity:rear?.54:.59,
        filter:`brightness(${rear?.57:.62}) blur(${rear?1.2:.55}px)`,
        duration:.11,
        ease:'power3.out',
        overwrite:true
      },.91)
      .to(item.img,{
        x:0,y:0,scale:1,
        opacity:.66,
        filter:'brightness(.68) blur(0px)',
        duration:.24,
        ease:'power3.out',
        overwrite:true
      },1.09);
    });
  }

  function addSoloist(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.set(img,{transformOrigin:'50% 50%'},0)
      /* 1 · visible pull-back: the soloist takes distance and gathers energy. */
      .to(img,{
        x:-direction*18,y:9,rotation:direction*4.5,
        scale:.83,scaleX:.975,scaleY:1.018,
        opacity:.94,filter:'brightness(.79)',
        duration:.22,ease:'power3.in'
      },.22)
      /* 2 · launch: short lift before the frontal attack. */
      .to(img,{
        x:direction*5,y:-18,rotation:direction*8,
        scale:.98,scaleX:.95,scaleY:1.04,
        opacity:1,filter:'brightness(1.02)',
        duration:.16,ease:'power4.inOut'
      },.44)
      /* 3 · strong zoom-in: it comes clearly toward the viewer. */
      .to(img,{
        x:0,y:-12,rotation:-direction*2.4,
        scale:1.31,scaleX:1.018,scaleY:.985,
        filter:'brightness(1.19) drop-shadow(0 24px 28px rgba(0,0,0,.58))',
        duration:.20,ease:'power4.in'
      },.60)
      /* 4 · elegant hard brake: no bounce, no elastic continuation. */
      .to(img,{
        y:-9,rotation:-direction*.55,
        scale:1.22,scaleX:1.008,scaleY:.994,
        filter:'brightness(1.17) drop-shadow(0 20px 24px rgba(0,0,0,.54))',
        duration:.065,ease:'power4.out'
      },.80)
      /* 5 · frozen hero pose: the stop must be perceptible. */
      .to(img,{
        y:-9,rotation:-direction*.55,scale:1.22,
        filter:'brightness(1.17) drop-shadow(0 20px 24px rgba(0,0,0,.54))',
        duration:.13,ease:'none'
      },.865)
      /* 6 · controlled settle, still clearly above the ensemble. */
      .to(img,{
        y:0,rotation:0,scale:1.15,scaleX:1,scaleY:1,
        filter:'brightness(1.10) drop-shadow(0 14px 18px rgba(0,0,0,.42))',
        duration:.19,ease:'expo.out'
      },.995)
      .to(img,{
        scale:1,filter:'brightness(1) drop-shadow(0 0 0 rgba(0,0,0,0))',
        duration:.20,ease:'power2.out'
      },1.23);
  }

  function addCopy(tl){
    const copy=$('.dish-copy');
    const nodes=[$('#dish-title'),$('#dish-meta'),$('#dish-short')].filter(Boolean);
    if(!copy||!nodes.length)return;
    tl.to(copy,{opacity:.12,y:7,duration:.18,ease:'power2.in',overwrite:true},0)
      .set(nodes,{opacity:0,y:10},.72)
      /* Identity arrives only after hero brake + crew recoil. */
      .to(copy,{opacity:1,y:0,duration:.12,ease:'power2.out'},1.12)
      .to(nodes,{opacity:1,y:0,duration:.24,stagger:.045,ease:'power3.out'},1.14);
  }

  function choreograph(direction=1,source='button'){
    killMaster();
    resetVisuals(.06);

    const list=geometry();
    if(list.length<3)return;
    const outgoing=centre(list);
    const solo=incomingFor(list,outgoing,direction);
    const feature=featureFor(list,outgoing,solo,direction);
    const trick=TRICKS[step%TRICKS.length];
    step++;

    master=gsap.timeline({
      defaults:{overwrite:true},
      onComplete(){
        resetVisuals(.20);
        beginBreath();
      }
    });

    /* V3 harmony remains. Only the protagonist phrase and reaction are upgraded. */
    addOutgoing(master,outgoing,direction);
    addEnsemble(master,list,solo,outgoing,feature,direction);
    addFeature(master,feature,trick,direction);
    addSoloist(master,solo,direction);
    addEnsembleRecoil(master,list,solo);
    addCopy(master);
  }

  function bind(){
    const next=$('#next-dish');
    const prev=$('#prev-dish');

    next?.addEventListener('click',()=>{if(!internalStep)choreograph(1,'button');},true);
    prev?.addEventListener('click',()=>{if(!internalStep)choreograph(-1,'button');},true);

    shell.addEventListener('keydown',e=>{
      if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
      e.preventDefault();
      e.stopImmediatePropagation();
      internalStep=true;
      (e.key==='ArrowRight'?next:prev)?.click();
      internalStep=false;
      choreograph(e.key==='ArrowRight'?1:-1,'keyboard');
    },true);

    shell.addEventListener('wheel',e=>{
      if(Math.abs(e.deltaY)<4)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const now=performance.now();
      if(now-lastWheelAt<520)return;
      lastWheelAt=now;
      const direction=e.deltaY>=0?1:-1;
      internalStep=true;
      (direction>0?next:prev)?.click();
      internalStep=false;
      choreograph(direction,'wheel');
    },{passive:false,capture:true});

    shell.addEventListener('pointerdown',e=>{
      dragStartX=e.clientX;
      dragWasActive=true;
      killMaster();
      stopBreath();
    },{passive:true,capture:true});

    shell.addEventListener('pointerup',e=>{
      if(!dragWasActive||dragStartX===null)return;
      const dx=e.clientX-dragStartX;
      dragStartX=null;
      dragWasActive=false;
      if(Math.abs(dx)<18){resetVisuals(.16);beginBreath();return;}
      setTimeout(()=>choreograph(dx<0?1:-1,'drag-release'),90);
    },{passive:true,capture:true});
  }

  function waitForOrbit(){
    if(dishes().length){bind();resetVisuals(0);beginBreath();return;}
    const observer=new MutationObserver(()=>{
      if(!dishes().length)return;
      observer.disconnect();
      bind();resetVisuals(0);beginBreath();
    });
    observer.observe(stage,{childList:true});
    setTimeout(()=>observer.disconnect(),5000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(waitForOrbit,240));
  else setTimeout(waitForOrbit,240);
})();